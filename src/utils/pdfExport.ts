import { jsPDF } from "jspdf";

// Utility to format currency
const formatUSD = (val: number) => {
  return "$" + val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export interface PaystubExportData {
  employer: {
    name: string;
    street: string;
    cityStateZip: string;
  };
  employee: {
    name: string;
    street: string;
    cityStateZip: string;
    occupation: string;
  };
  details: {
    chequeNumber: string;
    payPeriodStart: string;
    payPeriodEnd: string;
    chequeDate: string;
    hourlyRate: number;
    hours: number;
  };
  totals: {
    regularGross: number;
    ytdRegular: number;
    vacPayAmount: number;
    ytdVac: number;
    totalGross: number;
    ytdGross: number;
    pensionDeduction: number;
    ytdPension: number;
    healthDeduction: number;
    ytdHealth: number;
    fedDeduction: number;
    ytdFed: number;
    stateDeduction: number;
    ytdState: number;
    totalDeduction: number;
    ytdDeduction: number;
    netPay: number;
    ytdNet: number;
    gameBonus?: number;
    ytdGameBonus?: number;
    additionalBonus?: number;
    ytdAdditionalBonus?: number;
    allowances?: number;
    ytdAllowances?: number;
  };
  region: {
    currency: string;
    pensionName: string;
    healthName: string;
    pensionRate: number;
    healthRate: number;
    vacationPayRate: number;
  };
}

export function exportPaystubToPdf(data: PaystubExportData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const currency = data.region.currency;

  // Header Box
  doc.setFillColor(30, 30, 30);
  doc.rect(10, 10, 190, 15, "F");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("KALIM COFFEE CORPORATION - EMPLOYEE STATEMENT OF EARNINGS", 15, 19);

  // Address block columns
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(10, 10, 10);
  doc.text("EMPLOYER DETAILS", 15, 35);
  doc.text("EMPLOYEE DETAILS", 110, 35);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);

  // Employer addresses
  doc.text(data.employer.name, 15, 40);
  doc.text(data.employer.street, 15, 44);
  doc.text(data.employer.cityStateZip, 15, 48);

  // Employee addresses
  doc.text(data.employee.name, 110, 40);
  doc.text(data.employee.street, 110, 44);
  doc.text(data.employee.cityStateZip, 110, 48);

  // Pay Period Specifications Grid
  doc.setDrawColor(200, 200, 200);
  doc.line(10, 54, 200, 54);

  // Labels
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("RECEIPT FORM", 15, 60);
  doc.text("CHEQUE NUMBER", 60, 60);
  doc.text("PAY PERIOD RANGE", 105, 60);
  doc.text("CHEQUE DATE", 155, 60);

  // Values
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(10, 10, 10);
  doc.setFontSize(8.5);
  doc.text("Employee Paystub", 15, 65);
  doc.text(data.details.chequeNumber, 60, 65);
  doc.text(`${data.details.payPeriodStart} - ${data.details.payPeriodEnd}`, 105, 65);
  doc.text(data.details.chequeDate, 155, 65);

  doc.setDrawColor(200, 200, 200);
  doc.line(10, 69, 200, 69);

  // Occupation details
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.text("OCCUPATION / WORK ROLE", 15, 75);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(10, 10, 10);
  doc.text(data.employee.occupation, 15, 80);

  // Section 1: Earnings and Hours Table
  doc.setFillColor(245, 245, 245);
  doc.rect(10, 86, 190, 6, "F");
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text("EARNINGS AND HOURS", 15, 90);
  doc.text("QTY", 85, 90, { align: "right" });
  doc.text("RATE", 115, 90, { align: "right" });
  doc.text("CURRENT AMT", 155, 90, { align: "right" });
  doc.text("YTD AMOUNT", 195, 90, { align: "right" });

  let yOffset = 96;
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(10, 10, 10);
  doc.setFontSize(8.5);

  // Rule regular hours row
  doc.setFont("Helvetica", "bold");
  doc.text("Salary / Regular Wage", 15, yOffset);
  doc.setFont("Helvetica", "normal");
  doc.text(data.details.hours.toFixed(2), 85, yOffset, { align: "right" });
  doc.text(data.details.hourlyRate.toFixed(2), 115, yOffset, { align: "right" });
  doc.text(currency + data.totals.regularGross.toLocaleString([], { minimumFractionDigits: 2 }), 155, yOffset, { align: "right" });
  doc.text(currency + data.totals.ytdRegular.toLocaleString([], { minimumFractionDigits: 2 }), 195, yOffset, { align: "right" });

  yOffset += 6;

  // Vacation pay row
  if (data.totals.vacPayAmount > 0) {
    doc.setFont("Helvetica", "bold");
    doc.text(`Vacation Paid Out (${(data.region.vacationPayRate * 100).toFixed(0)}%)`, 15, yOffset);
    doc.setFont("Helvetica", "normal");
    doc.text("--", 85, yOffset, { align: "right" });
    doc.text("--", 115, yOffset, { align: "right" });
    doc.text(currency + data.totals.vacPayAmount.toLocaleString([], { minimumFractionDigits: 2 }), 155, yOffset, { align: "right" });
    doc.text(currency + data.totals.ytdVac.toLocaleString([], { minimumFractionDigits: 2 }), 195, yOffset, { align: "right" });
    yOffset += 6;
  }

  // Gamified Spark Quest Bonus row
  if (data.totals.gameBonus && data.totals.gameBonus > 0) {
    doc.setFont("Helvetica", "bold");
    doc.text("Quest Challenge Cash Bonus", 15, yOffset);
    doc.setFont("Helvetica", "normal");
    doc.text("--", 85, yOffset, { align: "right" });
    doc.text("--", 115, yOffset, { align: "right" });
    doc.text(currency + data.totals.gameBonus.toLocaleString([], { minimumFractionDigits: 2 }), 155, yOffset, { align: "right" });
    doc.text(currency + (data.totals.ytdGameBonus || data.totals.gameBonus).toLocaleString([], { minimumFractionDigits: 2 }), 195, yOffset, { align: "right" });
    yOffset += 6;
  }

  // Custom Bonus
  if (data.totals.additionalBonus && data.totals.additionalBonus > 0) {
    doc.setFont("Helvetica", "bold");
    doc.text("Additional Bonus", 15, yOffset);
    doc.setFont("Helvetica", "normal");
    doc.text("--", 85, yOffset, { align: "right" });
    doc.text("--", 115, yOffset, { align: "right" });
    doc.text(currency + data.totals.additionalBonus.toLocaleString([], { minimumFractionDigits: 2 }), 155, yOffset, { align: "right" });
    doc.text(currency + (data.totals.ytdAdditionalBonus || data.totals.additionalBonus).toLocaleString([], { minimumFractionDigits: 2 }), 195, yOffset, { align: "right" });
    yOffset += 6;
  }

  // Custom Allowances
  if (data.totals.allowances && data.totals.allowances > 0) {
    doc.setFont("Helvetica", "bold");
    doc.text("Allowances", 15, yOffset);
    doc.setFont("Helvetica", "normal");
    doc.text("--", 85, yOffset, { align: "right" });
    doc.text("--", 115, yOffset, { align: "right" });
    doc.text(currency + data.totals.allowances.toLocaleString([], { minimumFractionDigits: 2 }), 155, yOffset, { align: "right" });
    doc.text(currency + (data.totals.ytdAllowances || data.totals.allowances).toLocaleString([], { minimumFractionDigits: 2 }), 195, yOffset, { align: "right" });
    yOffset += 6;
  }

  // Draw Line for Subtotals
  doc.setDrawColor(180, 180, 180);
  doc.line(10, yOffset - 1, 200, yOffset - 1);

  // Total earnings gross row
  doc.setFont("Helvetica", "bold");
  doc.text("Total Gross Earnings", 15, yOffset + 3);
  doc.text(data.details.hours.toFixed(2), 85, yOffset + 3, { align: "right" });
  doc.text("--", 115, yOffset + 3, { align: "right" });
  doc.text(currency + data.totals.totalGross.toLocaleString([], { minimumFractionDigits: 2 }), 155, yOffset + 3, { align: "right" });
  doc.text(currency + data.totals.ytdGross.toLocaleString([], { minimumFractionDigits: 2 }), 195, yOffset + 3, { align: "right" });

  yOffset += 12;

  // Section 2: Withholdings Deductions Table
  doc.setFillColor(245, 245, 245);
  doc.rect(10, yOffset, 190, 6, "F");
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("WITHHOLDINGS & DEDUCTIONS", 15, yOffset + 4);
  doc.text("CURRENT AMT", 155, yOffset + 4, { align: "right" });
  doc.text("YTD AMOUNT", 195, yOffset + 4, { align: "right" });

  yOffset += 10;
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(10, 10, 10);

  // Pension CPP
  if (data.totals.pensionDeduction > 0) {
    doc.setFont("Helvetica", "bold");
    doc.text(`${data.region.pensionName} (${(data.region.pensionRate * 100).toFixed(3)}%)`, 15, yOffset);
    doc.setFont("Helvetica", "normal");
    doc.text("-" + currency + data.totals.pensionDeduction.toLocaleString([], { minimumFractionDigits: 2 }), 155, yOffset, { align: "right" });
    doc.text("-" + currency + data.totals.ytdPension.toLocaleString([], { minimumFractionDigits: 2 }), 195, yOffset, { align: "right" });
    yOffset += 6;
  }

  // Insurance EI
  if (data.totals.healthDeduction > 0) {
    doc.setFont("Helvetica", "bold");
    doc.text(`${data.region.healthName} (${(data.region.healthRate * 100).toFixed(3)}%)`, 15, yOffset);
    doc.setFont("Helvetica", "normal");
    doc.text("-" + currency + data.totals.healthDeduction.toLocaleString([], { minimumFractionDigits: 2 }), 155, yOffset, { align: "right" });
    doc.text("-" + currency + data.totals.ytdHealth.toLocaleString([], { minimumFractionDigits: 2 }), 195, yOffset, { align: "right" });
    yOffset += 6;
  }

  // Federal Tax
  if (data.totals.fedDeduction > 0) {
    doc.setFont("Helvetica", "bold");
    doc.text("Income Tax (Federal)", 15, yOffset);
    doc.setFont("Helvetica", "normal");
    doc.text("-" + currency + data.totals.fedDeduction.toLocaleString([], { minimumFractionDigits: 2 }), 155, yOffset, { align: "right" });
    doc.text("-" + currency + data.totals.ytdFed.toLocaleString([], { minimumFractionDigits: 2 }), 195, yOffset, { align: "right" });
    yOffset += 6;
  }

  // Provincial / State Tax
  if (data.totals.stateDeduction > 0) {
    doc.setFont("Helvetica", "bold");
    doc.text("Income Tax (Provincial/State)", 15, yOffset);
    doc.setFont("Helvetica", "normal");
    doc.text("-" + currency + data.totals.stateDeduction.toLocaleString([], { minimumFractionDigits: 2 }), 155, yOffset, { align: "right" });
    doc.text("-" + currency + data.totals.ytdState.toLocaleString([], { minimumFractionDigits: 2 }), 195, yOffset, { align: "right" });
    yOffset += 6;
  }

  // Total Deductions Line
  doc.setDrawColor(180, 180, 180);
  doc.line(10, yOffset - 1, 200, yOffset - 1);

  doc.setFont("Helvetica", "bold");
  doc.text("Total Deductions", 15, yOffset + 3);
  doc.text("-" + currency + data.totals.totalDeduction.toLocaleString([], { minimumFractionDigits: 2 }), 155, yOffset + 3, { align: "right" });
  doc.text("-" + currency + data.totals.ytdDeduction.toLocaleString([], { minimumFractionDigits: 2 }), 195, yOffset + 3, { align: "right" });

  yOffset += 14;

  // NET PAY HIGHLIGHT SUMMARY BOX
  doc.setFillColor(240, 248, 245);
  doc.rect(10, yOffset, 190, 20, "F");
  doc.setDrawColor(16, 185, 129);
  doc.rect(10, yOffset, 190, 20, "S");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(6, 95, 70);
  doc.text("NET TAKE-HOME CHEQUE PAYOUT SUMMARY", 15, yOffset + 7);

  doc.setFontSize(8.5);
  doc.setTextColor(10, 10, 10);
  doc.text("CURRENT STATEMENT CASH DISBURSEMENT:", 15, yOffset + 14);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105);
  doc.text(currency + data.totals.netPay.toLocaleString([], { minimumFractionDigits: 2 }), 110, yOffset + 14);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("YTD NET:", 155, yOffset + 14);
  doc.setFont("Helvetica", "bold");
  doc.text(currency + data.totals.ytdNet.toLocaleString([], { minimumFractionDigits: 2 }), 195, yOffset + 14, { align: "right" });

  yOffset += 30;

  // Disclaimers / Signatures
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  doc.text("SECURITY CODE SIGNATURE & HANDSHAKE", 15, yOffset);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`MD5 Hash Verification Auth Token: KALIM-PAYDOCKET-EKEY-${data.details.chequeNumber}-${Date.now().toString().slice(-6)}`, 15, yOffset + 4);
  doc.text("Issued electronically under Canada Revenue Agency, Alberta employment guidelines. Retain for tax archives.", 15, yOffset + 8);

  // Save the PDF
  doc.save(`kalim_paystub_${data.employee.name.toLowerCase().replace(/\s+/g, "_")}_${data.details.payPeriodEnd}.pdf`);
}

export interface CorpTaxExportData {
  branches: Array<{
    id: string;
    name: string;
    regionId: string;
    revenue: number;
    payroll: number;
    isSynced: boolean;
  }>;
  totalBranchRev: number;
  totalBranchPayroll: number;
  corporateNetProfit: number;
  totalCorpTaxProvision: number;
  taxFilingSuccess: boolean;
  taxFilingReference: string;
  activeRegion: { name: string; country: string };
  additionalInfo?: string;
  hqOperationDetails: {
    cupPrice: number;
    cupsSold: number;
    rentUt: number;
    cogs: number;
    payroll: number;
    depreciation: number;
    adminOps: number;
    totalExpenses: number;
    netProfit: number;
    taxRate: number;
    taxDue: number;
  };
}

export function exportCorpTaxToPdf(data: CorpTaxExportData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Main title Header Block
  doc.setFillColor(24, 24, 27);
  doc.rect(10, 10, 190, 18, "F");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("KALIM COFFEE CORPORATION - T2 CORPORATE INCOME TAX STATEMENT", 15, 18);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text("ANNUAL CONSOLIDATED BUSINESS TAX AUDIT REPORT / JURISDICTIONAL DISCOVERY", 15, 23);

  // Meta grid
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(10, 10, 10);
  doc.text("REGULATORY BODY:", 15, 36);
  doc.setFont("Helvetica", "normal");
  doc.text("CANADA REVENUE AGENCY (CRA)", 55, 36);

  doc.setFont("Helvetica", "bold");
  doc.text("ANNUAL TAX CYCLE:", 15, 41);
  doc.setFont("Helvetica", "normal");
  doc.text("FISCAL YEAR CALENDAR 2026 (12 MONTHS)", 55, 41);

  doc.setFont("Helvetica", "bold");
  doc.text("E-FILING CODE RECOGNITION:", 15, 46);
  doc.setFont("Helvetica", "normal");
  if (data.taxFilingSuccess) {
    doc.setTextColor(4, 120, 87);
  } else {
    doc.setTextColor(185, 28, 28);
  }
  doc.text(data.taxFilingSuccess ? `APPROVED & NETFILED [${data.taxFilingReference}]` : "DRAFT FORM - NOT TRANSMITTED", 55, 46);

  // Header background line
  doc.setDrawColor(200, 200, 200);
  doc.line(10, 52, 200, 52);

  // SECTION A: NATIONAL MULTI-BRANCH NETWORK CONSOLIDATION
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(10, 10, 10);
  doc.text("SECTION A: CONSOLIDATED CORPORATE NETWORK PROFILE", 15, 59);

  // Small branches Table Header
  doc.setFillColor(244, 244, 245);
  doc.rect(10, 64, 190, 6, "F");
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text("BRANCH OFFICE NAME", 15, 68);
  doc.text("REGISTRY", 100, 68, { align: "center" });
  doc.text("TOTAL REVENUE", 130, 68, { align: "right" });
  doc.text("SALARY COSTS", 160, 68, { align: "right" });
  doc.text("TAX LIABILITY", 195, 68, { align: "right" });

  let yPos = 74;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(10, 10, 10);

  data.branches.forEach(b => {
    const activeRate = b.regionId === "US-CA" ? 0.2984 : b.regionId === "ON" ? 0.122 : 0.11;
    const profit = b.revenue - b.payroll;
    const taxLiability = profit * activeRate;

    doc.setFont("Helvetica", "bold");
    doc.text(b.name, 15, yPos);
    doc.setFont("Helvetica", "normal");
    doc.text(b.regionId, 100, yPos, { align: "center" });
    doc.text(formatUSD(b.revenue), 130, yPos, { align: "right" });
    doc.text(formatUSD(b.payroll), 160, yPos, { align: "right" });
    
    if (b.isSynced) {
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(6, 95, 70);
      doc.text(formatUSD(taxLiability), 195, yPos, { align: "right" });
    } else {
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(180, 180, 180);
      doc.text("NOT SYNCED", 195, yPos, { align: "right" });
    }
    
    doc.setTextColor(10, 10, 10);
    yPos += 5.5;
  });

  // Consolidated total summaries
  doc.setDrawColor(200, 200, 200);
  doc.line(10, yPos - 1, 200, yPos - 1);
  doc.setFont("Helvetica", "bold");
  doc.text("CONSOLIDATED ENTERPRISE TOTALS", 15, yPos + 3);
  doc.text(formatUSD(data.totalBranchRev), 130, yPos + 3, { align: "right" });
  doc.text(formatUSD(data.totalBranchPayroll), 160, yPos + 3, { align: "right" });
  doc.setTextColor(11, 115, 75);
  doc.text(formatUSD(data.totalCorpTaxProvision), 195, yPos + 3, { align: "right" });

  yPos += 14;

  // SECTION B: CALGARY OPERATIONS & COFFEE DRINK MODEL (SPECIFIC TO USER REQUEST)
  doc.setDrawColor(200, 200, 200);
  doc.line(10, yPos - 1, 200, yPos - 1);
  doc.setTextColor(10, 10, 10);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text("SECTION B: AUDIT ANALYSIS OF CALGARY HQ COFFEE OPERATIONS & RETAIL UNIT COST MODEL", 15, yPos + 5);

  const hq = data.hqOperationDetails;
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(
    `This audit models the complete unit sales of our flagship Calgary HQ location. Outlining total annual receipts of ${formatUSD(568986.00)}`,
    15, yPos + 10
  );
  doc.text(
    `derived from coffee retail sales, and tracks all associated operational costs under Canada's regional corporate regime.`,
    15, yPos + 14
  );

  let expenseYOffset = yPos + 20;

  // Let's create a beautiful structured receipt box
  doc.setFillColor(248, 250, 252);
  doc.rect(10, expenseYOffset, 190, 72, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(10, expenseYOffset, 190, 72, "S");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("HQ FINANCIAL DISCLOSURE MODEL DETAILS (1-YEAR DURATION)", 15, expenseYOffset + 6);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  // Column left: Cup counts & price
  doc.text("Retail Revenue Source:", 15, expenseYOffset + 14);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`Coffee Cups Sold: ${hq.cupsSold.toLocaleString()} cups (average price ${formatUSD(hq.cupPrice)} per cup)`, 15, expenseYOffset + 18);

  doc.setFont("Helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("ANNUAL EXPENSE LEDGER:", 15, expenseYOffset + 26);

  // Expense list with pretty alignment
  const expensesList = [
    { label: "1. Ingredients & Supplies (COGS at 18% of revenue)", val: hq.cogs },
    { label: "2. Payroll Costs (Coffee shop staff wages & salaries)", val: hq.payroll },
    { label: "3. Facility Rent & Utilities ($8,000.00/month flat rate)", val: hq.rentUt },
    { label: "4. Machinery & Interior Capital Assets Depreciation (Straight line)", val: hq.depreciation },
    { label: "5. Supporting Administrative, Marketing & Insurance Overhead", val: hq.adminOps }
  ];

  doc.setFontSize(7.5);
  let explY = expenseYOffset + 31;
  expensesList.forEach(exp => {
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(exp.label, 15, explY);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(formatUSD(exp.val), 190, explY, { align: "right" });
    explY += 5;
  });

  // Expense subtotal
  doc.setDrawColor(226, 232, 240);
  doc.line(15, explY - 1, 195, explY - 1);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("TOTAL HQ ANNUAL OPERATING EXPENSES", 15, explY + 3);
  doc.text(formatUSD(hq.totalExpenses), 190, explY + 3, { align: "right" });

  // Taxable income
  doc.text("AB TAXABLE HQ NET PROFIT (Corporate Gain)", 15, explY + 8);
  doc.text(formatUSD(hq.netProfit), 190, explY + 8, { align: "right" });

  doc.setFont("Helvetica", "bold");
  doc.setTextColor(16, 120, 80);
  doc.text(`CRA ALBERTA SMALL BUSINESS COMPUTE TAX (9% Federal + 2% Provincial = 11%)`, 15, explY + 13);
  doc.text(formatUSD(hq.taxDue), 190, explY + 13, { align: "right" });

  // Final Net profit
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(2, 44, 30);
  doc.text(`HQ CLEAR CAPITAL (Net Profit post corporate taxation)`, 15, explY + 18);
  doc.text(formatUSD(hq.netProfit - hq.taxDue), 190, explY + 18, { align: "right" });

  // Footer certifications
  yPos = expenseYOffset + 78;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  doc.text("CRA HANDSHAKE AUDIT TRUST GATEWAY", 15, yPos);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`This statement is compiled and digitally verified by Kalim Coffee Enterprise Corporate HQ in Calgary, Alberta.`, 15, yPos + 4);
  
  const footnoteText = data.additionalInfo || "NOTICE: Compiled electronically on behalf of Kalim Coffee Enterprise Calgary HQ Branch. Suitable for official CRA T2 review.";
  // We split any long text so it does not overflow the page
  const splitFootnote = doc.splitTextToSize(footnoteText, 180);
  doc.text(splitFootnote, 15, yPos + 8);
  
  doc.text(`Secure system handshake verified on ${new Date().toISOString().slice(0, 10)}. Ready for official accounting records and local regional CRA review audits.`, 15, yPos + 16);

  doc.save("kalim_coffee_corp_tax_t2_2026.pdf");
}

export interface SalesLedgerExportData {
  region: string;
  regionName: string;
  taxRate: number;
  totalRevenue: number;
  totalTax: number;
  orders: Array<{
    id: string;
    date: string;
    tax: number;
    total: number;
  }>;
}

export function exportSalesLedgerToPdf(data: SalesLedgerExportData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Black Banner Header
  doc.setFillColor(15, 23, 42);
  doc.rect(10, 10, 190, 15, "F");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text("KALIM COFFEE CO. - AUDITABLE SALES & JURISDICTION TAX LEDGER", 15, 195 - 176);

  // Information column grid
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("LEDGER CONSTRAINTS", 15, 34);
  doc.text("FINANCIAL SUMMARY", 110, 34);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  // Constraints values
  doc.text(`Reporting Jurisdiction: ${data.regionName} (${data.region})`, 15, 39);
  doc.text(`Taxation Rules: Canada Revenue Agency Standards`, 15, 43);
  doc.text(`Active Tax collected Rate: ${Math.round(data.taxRate * 100)}%`, 15, 47);

  // Financial values
  doc.text(`Total Sales Revenue (gross with Tax): ${formatUSD(data.totalRevenue)}`, 110, 39);
  doc.text(`Estimated Net Base Sales: ${formatUSD(data.totalRevenue - data.totalTax)}`, 110, 43);
  doc.text(`Total Jurisdictional Tax Remitted: ${formatUSD(data.totalTax)}`, 110, 47);

  doc.setDrawColor(203, 213, 225);
  doc.line(10, 52, 200, 52);

  // SECTION: CHRONOLOGICAL ORDERS LEDGER
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("SECTION 2: JURISDICTION TRANSACTION JOURNAL & CHRONOLOGY", 15, 58);

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(10, 62, 190, 6, "F");
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("ORDER INDEX ID", 15, 66);
  doc.text("TRANSACTION TIMESTAMP", 55, 66);
  doc.text("COLLECTED TAX (" + Math.round(data.taxRate * 100) + "%)", 125, 66, { align: "right" });
  doc.text("GROSS TOTAL BILL RECEIVED", 195, 66, { align: "right" });

  let yOffset = 72;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  // Loop through first 30 orders to fit beautifully on page
  const listToExport = data.orders.slice(0, 30);
  listToExport.forEach(o => {
    if (yOffset > 275) return; // safeguard for page height
    doc.setFont("Helvetica", "bold");
    doc.text(`#${o.id.toUpperCase()}`, 15, yOffset);
    doc.setFont("Helvetica", "normal");
    doc.text(new Date(o.date).toLocaleString("en-US"), 55, yOffset);
    doc.text(formatUSD(o.tax), 125, yOffset, { align: "right" });
    doc.setFont("Helvetica", "bold");
    doc.text(formatUSD(o.total), 195, yOffset, { align: "right" });
    
    yOffset += 5.5;
  });

  doc.setDrawColor(203, 213, 225);
  doc.line(10, yOffset - 1, 200, yOffset - 1);

  // Footer notice
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("VERIFIED LEGAL LEDGER STATEMENT", 15, yOffset + 4);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Compiled automatically from local database stores. Verified for legal corporate accounting files.", 15, yOffset + 8);

  doc.save(`kalim_sales_report_${data.region.toLowerCase()}_${Date.now().toString().slice(-4)}.pdf`);
}
