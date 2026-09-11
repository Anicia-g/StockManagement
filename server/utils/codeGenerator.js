import Product from '../models/Product.js';
import Purchase from '../models/Purchase.js';
import Transfer from '../models/Transfer.js';
import Indent from '../models/Indent.js';

/**
 * Helper to find max numeric suffix for a given prefix and collection
 */
const getNextSequence = async (Model, field, prefix) => {
  try {
    const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');
    const items = await Model.find({ [field]: regex }, { [field]: 1 }).lean();
    let maxNum = 0;
    for (const item of items) {
      const val = item[field] || '';
      const match = val.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    let nextNum = maxNum + 1;
    let code = `${prefix}-${String(nextNum).padStart(4, '0')}`;
    while (await Model.findOne({ [field]: code })) {
      nextNum += 1;
      code = `${prefix}-${String(nextNum).padStart(4, '0')}`;
    }
    return code;
  } catch (error) {
    const count = await Model.countDocuments();
    let nextNum = count + 1;
    let code = `${prefix}-${String(nextNum).padStart(4, '0')}`;
    while (await Model.findOne({ [field]: code })) {
      nextNum += 1;
      code = `${prefix}-${String(nextNum).padStart(4, '0')}`;
    }
    return code;
  }
};

/**
 * Generate next sequential product code: CON-0001, CON-0002, etc.
 */
export const generateProductCode = async () => {
  return await getNextSequence(Product, 'productCode', 'CON');
};

/**
 * Generate next sequential purchase number: PUR-0001, PUR-0002, etc.
 */
export const generatePurchaseNumber = async () => {
  // Support checking both purchaseId and purchaseNumber
  return await getNextSequence(Purchase, 'purchaseId', 'PUR');
};

/**
 * Generate next sequential transfer number: TRF-0001, TRF-0002, etc.
 */
export const generateTransferNumber = async () => {
  return await getNextSequence(Transfer, 'transferId', 'TRF');
};

/**
 * Generate next sequential indent number: IND-0001, IND-0002, etc.
 */
export const generateIndentNumber = async () => {
  return await getNextSequence(Indent, 'indentNumber', 'IND');
};

