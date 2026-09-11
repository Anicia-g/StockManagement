import Product from '../models/Product.js';
import Purchase from '../models/Purchase.js';
import Transfer from '../models/Transfer.js';
import Indent from '../models/Indent.js';

/**
 * Generate next sequential product code: CON-0001, CON-0002, etc.
 */
export const generateProductCode = async () => {
  const count = await Product.countDocuments();
  let nextNum = count + 1;
  let code = `CON-${String(nextNum).padStart(4, '0')}`;
  
  // Ensure uniqueness in case of deleted items
  while (await Product.findOne({ productCode: code })) {
    nextNum += 1;
    code = `CON-${String(nextNum).padStart(4, '0')}`;
  }
  return code;
};

/**
 * Generate next sequential purchase number: PUR-0001, PUR-0002, etc.
 */
export const generatePurchaseNumber = async () => {
  const count = await Purchase.countDocuments();
  let nextNum = count + 1;
  let code = `PUR-${String(nextNum).padStart(4, '0')}`;
  
  while (await Purchase.findOne({ purchaseId: code })) {
    nextNum += 1;
    code = `PUR-${String(nextNum).padStart(4, '0')}`;
  }
  return code;
};

/**
 * Generate next sequential transfer number: TRF-0001, TRF-0002, etc.
 */
export const generateTransferNumber = async () => {
  const count = await Transfer.countDocuments();
  let nextNum = count + 1;
  let code = `TRF-${String(nextNum).padStart(4, '0')}`;
  
  while (await Transfer.findOne({ transferId: code })) {
    nextNum += 1;
    code = `TRF-${String(nextNum).padStart(4, '0')}`;
  }
  return code;
};

/**
 * Generate next sequential indent number: IND-0001, IND-0002, etc.
 */
export const generateIndentNumber = async () => {
  const count = await Indent.countDocuments();
  let nextNum = count + 1;
  let code = `IND-${String(nextNum).padStart(4, '0')}`;
  
  while (await Indent.findOne({ indentNumber: code })) {
    nextNum += 1;
    code = `IND-${String(nextNum).padStart(4, '0')}`;
  }
  return code;
};
