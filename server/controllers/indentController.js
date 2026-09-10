import Indent from '../models/Indent.js';
import {
  createIndent as createIndentService,
  submitIndent as submitIndentService,
  recommendIndent as recommendIndentService,
  approveIndent as approveIndentService,
  rejectIndent as rejectIndentService,
  issueIndent as issueIndentService
} from '../services/indentService.js';

// @desc    Get all indents with filters
// @route   GET /api/indents
export const getIndents = async (req, res, next) => {
  try {
    const { status, department, search, page, limit } = req.query;
    let query = {};

    // Role filtering: Non-admins can only see their department unless viewer
    if (req.user && req.user.role === 'FACULTY') {
      query.$or = [
        { requesterId: req.user._id },
        { department: req.user.department },
        { requestingDepartment: req.user.department }
      ];
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (department && department !== 'ALL') {
      query.$or = [
        { department: { $regex: department, $options: 'i' } },
        { requestingDepartment: { $regex: department, $options: 'i' } }
      ];
    }

    if (search) {
      query.$or = [
        { indentNumber: { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } },
        { requestedBy: { $regex: search, $options: 'i' } },
        { requesterName: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.max(1, parseInt(limit) || 50);
    const skip = (pageNum - 1) * pageSize;

    const total = await Indent.countDocuments(query);
    const indents = await Indent.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    res.json({
      success: true,
      count: indents.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
      limit: pageSize,
      indents,
      data: indents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single indent by ID or IndentNumber
// @route   GET /api/indents/:id
export const getIndentById = async (req, res, next) => {
  try {
    let indent = null;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      indent = await Indent.findById(req.params.id);
    }
    if (!indent) {
      indent = await Indent.findOne({ indentNumber: req.params.id.toUpperCase() });
    }

    if (!indent) {
      return res.status(404).json({ success: false, message: 'Indent not found.' });
    }

    res.json({ success: true, indent, data: indent });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new indent request
// @route   POST /api/indents
export const createIndent = async (req, res, next) => {
  try {
    const {
      indentNumber,
      department,
      requestingDepartment,
      purpose,
      requiredDate,
      remarks,
      items
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required in the indent.' });
    }

    const indent = await createIndentService({
      indentNumber,
      department,
      requestingDepartment,
      purpose,
      requiredDate,
      remarks,
      items,
      user: req.user
    });

    res.status(201).json({
      success: true,
      message: `Indent ${indent.indentNumber} created successfully.`,
      indent,
      data: indent
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update draft indent
// @route   PUT /api/indents/:id
export const updateIndent = async (req, res, next) => {
  try {
    const indent = await Indent.findById(req.params.id);
    if (!indent) {
      return res.status(404).json({ success: false, message: 'Indent not found.' });
    }

    if (indent.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: `Cannot edit indent with status "${indent.status}". Only DRAFT indents can be updated.`
      });
    }

    const { purpose, requiredDate, remarks, items } = req.body;
    if (purpose) indent.purpose = purpose;
    if (requiredDate) indent.requiredDate = requiredDate;
    if (remarks !== undefined) indent.remarks = remarks;
    if (Array.isArray(items)) indent.items = items;

    await indent.save();
    res.json({ success: true, message: 'Indent updated successfully.', indent, data: indent });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit indent (DRAFT -> SUBMITTED)
// @route   POST /api/indents/:id/submit
export const submitIndent = async (req, res, next) => {
  try {
    const indent = await submitIndentService(req.params.id, req.user);
    res.json({ success: true, message: 'Indent submitted for review.', indent, data: indent });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Recommend indent (SUBMITTED -> RECOMMENDED)
// @route   POST /api/indents/:id/recommend
export const recommendIndent = async (req, res, next) => {
  try {
    const indent = await recommendIndentService(req.params.id, req.body, req.user);
    res.json({ success: true, message: 'Indent recommended successfully.', indent, data: indent });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Approve indent (RECOMMENDED / SUBMITTED -> APPROVED)
// @route   POST /api/indents/:id/approve
export const approveIndent = async (req, res, next) => {
  try {
    const indent = await approveIndentService(req.params.id, req.body, req.user);
    res.json({ success: true, message: 'Indent approved successfully.', indent, data: indent });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Reject indent
// @route   POST /api/indents/:id/reject
export const rejectIndent = async (req, res, next) => {
  try {
    const indent = await rejectIndentService(req.params.id, req.body, req.user);
    res.json({ success: true, message: 'Indent rejected.', indent, data: indent });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Issue approved stock against indent
// @route   POST /api/indents/:id/issue
export const issueIndent = async (req, res, next) => {
  try {
    const result = await issueIndentService(req.params.id, req.body, req.user);
    res.json({
      success: true,
      message: `Stock successfully issued against Indent ${result.indent.indentNumber}.`,
      data: result,
      indent: result.indent,
      transactions: result.transactions
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Review indent (Approve / Reject modal from frontend)
// @route   POST /api/indents/:id/review
export const reviewIndent = async (req, res, next) => {
  try {
    const { action, approvedItems, adminRemarks } = req.body;

    if (action === 'REJECT') {
      const indent = await rejectIndentService(req.params.id, { remarks: adminRemarks }, req.user);
      return res.json({ success: true, message: 'Indent rejected.', indent, data: indent });
    }

    const indent = await approveIndentService(req.params.id, {
      approvals: approvedItems,
      remarks: adminRemarks
    }, req.user);

    res.json({ success: true, message: 'Indent review completed.', indent, data: indent });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
