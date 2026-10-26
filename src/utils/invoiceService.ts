/* services/invoiceService.ts */
import type { InvoiceData } from "@/config/types/invoice";
import type { SettingData } from "../services/post.service";

// Default settings for fallback
const DEFAULT_SETTINGS: SettingData = {
  logo: "",
  name: "Computer World",
  phone: "+880 XXXX-XXXXXX",
  address: "Sarishabari, Jamalpur",
  email: "store@computerworld.com",
  fbPage: "",
};

/** Read settings from Zustand localStorage */
function getSettingsFromLocalStorage(): SettingData {
  try {
    const raw = localStorage.getItem("website-settings-storage");
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw);

    return {
      ...DEFAULT_SETTINGS,
      ...(parsed?.state?.settings ?? {}),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Build the HTML layout for the invoice */
export function buildInvoiceHTML(data: InvoiceData): string {
  const safeSettings = getSettingsFromLocalStorage();

  const discountAmount = data.subtotal * (data.discount / 100);
  const totalAfterDiscount =
    data.subtotal - discountAmount + data.serviceCharge;

  const paidAmount = data.paidAmount || data.total;
  const dueAmount = data.dueAmount || 0;
  const paymentStatus =
    data.paymentStatus || (dueAmount > 0 ? "partial" : "paid");

  const currentDate = new Date(data.date);
  const dueDate = new Date(currentDate.setDate(currentDate.getDate() + 7));

  const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${data.orderId}</title>
  <style>
    /* Modern Invoice Template - Clean Professional Design */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      background: #ffffff;
      color: #333333;
      line-height: 1.3;
      font-size: 12px;
      font-weight: 400;
    }
    
    .invoice-wrapper {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 10mm;
      background: #ffffff;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    
    .invoice-content {
      flex: 1;
    }
    
    /* Header Section */
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
      padding-bottom: -5px;
      border-bottom: 1px solid #e8ecef;
    }
    
    .company-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    
    .company-details h2 {
      font-size: 20px;
      font-weight: 700;
      color: #D52C3A;
      margin-bottom: 4px;
    }
    
    .company-details .tagline {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    .company-meta {
      font-size: 10px;
      color: #64748b;
      line-height: 1.4;
    }
    
    .company-meta div {
      margin-bottom: 2px;
    }
    
    .contact-info {
      text-align: right;
      font-size: 10px;
      color: #64748b;
    }
    
    .contact-info div {
      margin-bottom: 2px;
    }
    
    /* Invoice Title */
    .invoice-title {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .invoice-title h2 {
      font-size: 24px;
      font-weight: 300;
      color: #1e293b;
      letter-spacing: 2px;
      margin-bottom: 5px;
    }
    
    .invoice-title .subtitle {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    /* Details Grid */
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .detail-box {
      padding: 0;
    }
    
    .detail-box h3 {
      font-size: 12px;
      font-weight: 600;
      color: #D52C3A;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #D52C3A;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .detail-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      padding-bottom: 5px;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .detail-label {
      font-weight: 500;
      color: #64748b;
    }
    
    .detail-value {
      font-weight: 600;
      color: #1e293b;
    }
    
    /* Products Table */
    .products-section {
      margin-bottom: 15px;
    }
    
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    
    .invoice-table thead {
      background: #D52C3A !important;
      color: white;
    }
    
    .invoice-table th {
      padding: 8px 6px;
      text-align: left;
      font-weight: 600;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #D52C3A !important;
      color: white !important;
    }
    
    .invoice-table td {
      padding: 6px 6px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .invoice-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    /* Summary Section */
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 15px;
    }
    
    .summary-card {
      width: 250px;
      background: #f8fafc;
      padding: 15px;
      border-radius: 6px;
      border-left: 3px solid #D52C3A;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      padding-bottom: 5px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .summary-total {
      font-size: 13px;
      font-weight: 700;
      color: #D52C3A;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #cbd5e1;
    }
    
    /* Payment Breakdown Styles */
    .payment-breakdown {
      margin-top: 12px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }
    
    .payment-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      padding-bottom: 5px;
    }
    
    .paid-row {
      color: #059669;
      font-weight: 600;
    }
    
    .due-row {
      color: #dc2626;
      font-weight: 600;
    }
    
    .balance-note {
      font-size: 9px;
      color: #64748b;
      margin-top: 4px;
      text-align: center;
    }
    
    .full-payment-note {
      font-size: 9px;
      color: #64748b;
      margin-top: 4px;
      text-align: center;
    }
    
    /* Terms Section - Bilingual Layout */
    .terms-section {
      margin-bottom: 15px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 6px;
      font-size: 9px;
    }
    
    .terms-section h3 {
      color: #D52C3A;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .terms-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 8px;
    }
    
    .terms-column {
      line-height: 1.4;
      color: #475569;
    }
    
    .terms-column h4 {
      font-size: 10px;
      font-weight: 600;
      color: #D52C3A;
      margin-bottom: 6px;
      padding-bottom: 3px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .bangla-text {
      font-family: 'Hind Siliguri', 'Inter', sans-serif;
      direction: ltr;
      text-align: left;
    }
    
    .terms-list {
      list-style-type: none;
      padding-left: 0;
    }
    
    .terms-list li {
      margin-bottom: 4px;
      padding-left: 12px;
      position: relative;
    }
    
    .terms-list li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #D52C3A;
      font-weight: bold;
    }
    
    /* Payment Note Box */
    .payment-note-box {
      margin-bottom: 8px;
      padding: 6px;
      border-radius: 4px;
      font-size: 9px;
      line-height: 1.4;
    }
    
    .partial-note {
      background: #fef9c3;
      border-left: 3px solid #f59e0b;
    }
    
    .unpaid-note {
      background: #fee2e2;
      border-left: 3px solid #dc2626;
    }
    
    /* Footer - Compact */
    .invoice-footer {
      text-align: center;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 9px;
      margin-top: auto;
    }
    
    .thank-you {
      font-size: 11px;
      font-weight: 600;
      color: #D52C3A;
      margin-bottom: 4px;
    }
    
    .footer-contacts {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-top: 4px;
      font-size: 8px;
    }
    
    .payment-footer-note {
      font-size: 9px;
      margin-bottom: 4px;
      color: #475569;
    }
    
    /* Status Badge */
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .status-paid {
      background: #dcfce7;
      color: #166534;
    }
    
    .status-partial {
      background: #fef9c3;
      color: #854d0e;
    }
    
    .status-unpaid {
      background: #fee2e2;
      color: #991b1b;
    }
    
    /* Print Styles */
    @media print {
      body {
        margin: 0;
        padding: 0;
        background: white;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      .invoice-wrapper {
        width: 100%;
        min-height: 100vh;
        padding: 10mm;
        box-shadow: none;
        border: none;
        margin: 0;
      }
      
      .invoice-table thead {
        background: #D52C3A !important;
        color: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .invoice-table th {
        background: #D52C3A !important;
        color: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper" id="invoice">
    <div class="invoice-content">
      <!-- Header -->
      <div class="invoice-header">
        <div class="company-info">
         <div class="company-details">
  ${
    safeSettings.logo
      ? `<img 
          src="${safeSettings.logo}" 
          alt="Company Logo" 
          style="max-height: 120px; margin-bottom: 6px; margin-top: -40px;"
        />`
      : `<h2>${escapeHtml(safeSettings.name)}</h2>`
  }
</div>
        </div>
        <div class="contact-info">
          <div>${escapeHtml(
            safeSettings.address || "Sarishabari, Jamalpur",
          )}</div>
          <div>${safeSettings.phone || "+880 XXXX-XXXXXX"}</div>
          <div>${safeSettings.email || "store@computerworld.com"}</div>
          ${
            safeSettings.fbPage
              ? `<div>${escapeHtml(safeSettings.fbPage)}</div>`
              : "<div>www.computerworld.com</div>"
          }
        </div>
      </div>

      <!-- Invoice Title -->
      <div class="invoice-title">
        <h2>INVOICE</h2>
        <div class="subtitle">Tax Invoice / Cash Memo</div>
      </div>

      <!-- Details Grid -->
      <div class="details-grid">
        <div class="detail-box">
          <h3>Bill To</h3>
          <div class="detail-item">
            <span class="detail-label">Customer Name:</span>
            <span class="detail-value">${escapeHtml(data.customerName)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Phone Number:</span>
            <span class="detail-value">${data.phoneNumber}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Payment Method:</span>
            <span class="detail-value">${data.paymentType.toUpperCase()}</span>
          </div>
        </div>
        
        <div class="detail-box">
          <h3>Invoice Details</h3>
          <div class="detail-item">
            <span class="detail-label">Invoice Number:</span>
            <span class="detail-value">${data.orderId}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Invoice Date:</span>
            <span class="detail-value">${new Date(
              data.date,
            ).toLocaleDateString()}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Due Date:</span>
            <span class="detail-value">${dueDate.toLocaleDateString()}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Payment Status:</span>
            <span class="detail-value">
              <span class="status-badge ${
                dueAmount > 0 ? "status-partial" : "status-paid"
              }">
                ${dueAmount > 0 ? "Partial" : "Paid"}
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- Products Table -->
      <div class="products-section">
        <table class="invoice-table">
          <thead>
            <tr>
              <th style="width: 50%">Description</th>
              <th style="width: 15%" class="text-center">Qty</th>
              <th style="width: 15%" class="text-right">Unit Price</th>
              <th style="width: 20%" class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${data.products
              .map(
                (product) => `
              <tr>
                <td>
  ${escapeHtml(product.name)}
  ${
    product.serialNumbers?.length
      ? `<div style="font-size:9px;color:#64748b;margin-top:2px">
           SN: ${product.serialNumbers.join(", ")}
         </div>`
      : ""
  }
  ${
    product.warranty
      ? `<div style="font-size:9px;color:#16a34a;margin-top:2px">
           Warranty: ${escapeHtml(product.warranty)}
         </div>`
      : ""
  }
</td>
                <td >${product.quantity}</td>
                <td >${formatCurrency(product.price)}</td>
                <td >${formatCurrency(product.total)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <!-- Summary Section -->
      <div class="summary-section">
        <div class="summary-card">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(data.subtotal)}</span>
          </div>
          ${
            data.discount > 0
              ? `
            <div class="summary-row">
              <span>Discount (${data.discount}%):</span>
              <span>- ${formatCurrency(discountAmount)}</span>
            </div>
          `
              : ""
          }
          ${
            data.serviceCharge > 0
              ? `
            <div class="summary-row">
              <span>Service Charge:</span>
              <span>${formatCurrency(data.serviceCharge)}</span>
            </div>
          `
              : ""
          }
          <div class="summary-row summary-total">
            <span>TOTAL AMOUNT:</span>
            <span>${formatCurrency(totalAfterDiscount)}</span>
          </div>
          
          <!-- Payment Breakdown -->
          ${
            dueAmount > 0
              ? `
          <div class="payment-breakdown">
            <div class="payment-row paid-row">
              <span>Paid Amount:</span>
              <span>${formatCurrency(paidAmount)}</span>
            </div>
            <div class="payment-row due-row">
              <span>Due Amount:</span>
              <span>${formatCurrency(dueAmount)}</span>
            </div>
            <div class="balance-note">
              Balance to be paid: ${formatCurrency(dueAmount)}
            </div>
          </div>
          `
              : `
          <div class="payment-breakdown">
            <div class="payment-row paid-row">
              <span>Paid Amount:</span>
              <span>${formatCurrency(totalAfterDiscount)}</span>
            </div>
            <div class="full-payment-note">
              Payment completed in full
            </div>
          </div>
          `
          }
        </div>
      </div>

      <!-- Terms & Conditions - Bilingual -->
      <div class="terms-section">
        <h3>Terms & Conditions / শর্তাবলী</h3>
        
        ${
          dueAmount > 0
            ? `
        <div class="payment-note-box partial-note">
          <strong>Payment Note:</strong> This invoice has a pending balance of ${formatCurrency(
            dueAmount,
          )}. Please pay by ${dueDate.toLocaleDateString()}.
        </div>
        `
            : ""
        }
        
        <div class="terms-columns">
          <!-- English Terms -->
          <div class="terms-column">
            <h4>English</h4>
            <ul class="terms-list">
              <li>All products carry manufacturer's warranty period as per product category</li>
              <li>Warranty does not cover physical damage, liquid damage, or unauthorized repairs</li>
              <li>Software products are non-refundable once opened or activated</li>
              <li>Defective products must be returned within 7 days with original packaging and accessories</li>
              <li>Keep this invoice for warranty claims - warranty void without original invoice</li>
              <li>For mobile phones: Keep SIM tray, IMEI sticker, and all original accessories</li>
              <li>Warranty requires intact warranty seal and no tampering with security stickers</li>
              <li>Service charges may apply for diagnostic and non-warranty repairs</li>
              <li>Prices are inclusive of VAT where applicable</li>
            </ul>
          </div>
          
          <!-- Bangla Terms -->
          <div class="terms-column bangla-text">
            <h4>বাংলা</h4>
            <ul class="terms-list">
              <li>সকল পণ্য প্রস্তুতকারকের ওয়ারেন্টি বহন করে (পণ্যের ক্যাটাগরি অনুযায়ী)</li>
              <li>ওয়ারেন্টি শারীরিক ক্ষতি, তরল ক্ষতি বা অননুমোদিত মেরামত কভার করে না</li>
              <li>সফটওয়্যার পণ্য একবার খোলা বা অ্যাক্টিভেট করলে ফেরতযোগ্য নয়</li>
              <li>ত্রুটিপূর্ণ পণ্য ৭ দিনের মধ্যে অরিজিনাল প্যাকেজিং ও আনুষঙ্গিকসহ ফেরত দিন</li>
              <li>ওয়ারেন্টি দাবির জন্য এই ইনভয়েস সংরক্ষণ করুন - অরিজিনাল ইনভয়েস ছাড়া ওয়ারেন্টি বাতিল</li>
              <li>মোবাইল ফোনের জন্য: SIM ট্রে, IMEI স্টিকার এবং সকল অরিজিনাল আনুষাঙ্গিক সংরক্ষণ করুন</li>
              <li>ওয়ারেন্টির জন্য অক্ষত ওয়ারেন্টি সীল এবং সিকিউরিটি স্টিকার অপরিবর্তিত থাকা আবশ্যক</li>
              <li>ডায়াগনস্টিক এবং নন-ওয়ারেন্টি মেরামতের জন্য সার্ভিস চার্জ প্রযোজ্য</li>
              <li>যেখানে প্রযোজ্য দাম VAT সহ</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="invoice-footer">
      <div class="thank-you">
        ${
          dueAmount > 0
            ? "Partial Payment Received! / আংশিক পেমেন্ট প্রাপ্ত!"
            : "Thank You For Your Purchase! / ক্রয়ের জন্য ধন্যবাদ!"
        }
      </div>
      <div class="payment-footer-note">
        ${
          dueAmount > 0
            ? `Payment Status: ${paymentStatus.toUpperCase()} | Balance Due: ${formatCurrency(
                dueAmount,
              )}`
            : "Payment completed successfully. This is a computer generated invoice. / পেমেন্ট সফলভাবে সম্পন্ন হয়েছে। এটি একটি কম্পিউটার জেনারেটেড ইনভয়েস।"
        }
      </div>
      <div class="footer-contacts">
        <span>📞 ${safeSettings.phone || "+880 XXXX-XXXXXX"}</span>
        <span>✉️ ${safeSettings.email || "support@computerworld.com"}</span>
        ${
          safeSettings.fbPage
            ? `<span>🌐 ${escapeHtml(safeSettings.fbPage)}</span>`
            : "<span>🌐 www.computerworld.com</span>"
        }
      </div>
    </div>
  </div>
</body>
</html>`;
}

/** Escape HTML text safely */
function escapeHtml(text: string): string {
  // Create a temporary div element
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export class InvoiceService {
  /**
   * Fetches logo from public path and returns a data URL string on success, or null on failure.
   */
  private static async fetchLogoDataUrl(path: string): Promise<string | null> {
    try {
      const cacheBuster = `?t=${Date.now()}`;
      const url = path.startsWith("http") ? path : path + cacheBuster;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 8000);

      const res = await fetch(url, {
        cache: "no-cache",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return null;
      }

      const blob = await res.blob();

      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result === "string") {
            resolve(result);
          } else {
            reject(new Error("Failed to read logo blob as data URL"));
          }
        };
        reader.onerror = () => {
          reject(
            new Error("FileReader error while converting logo to data URL"),
          );
        };
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  /** Load logo and convert to base64 */
  private static async loadLogoAsBase64(): Promise<string> {
    const possiblePaths = [
      "/Logo-02.svg",
      "/logo-02.svg",
      "/logos/Logo-02.svg",
      "/images/Logo-02.svg",
      "/assets/Logo-02.svg",
      "./Logo-02.svg",
      `${window.location.origin}/Logo-02.svg`,
      "/Logo-02.png",
      "/logo-02.png",
      "/Logo-02.jpg",
      "/logo-02.jpg",
      "/Logo-02.jpeg",
      "/logo-02.jpeg",
    ];

    for (const path of possiblePaths) {
      try {
        const logoDataUrl = await this.fetchLogoDataUrl(path);
        if (logoDataUrl && logoDataUrl.startsWith("data:")) {
          return logoDataUrl;
        }
      } catch {
        continue;
      }
    }

    throw new Error("Logo not found in any of the expected locations");
  }

  /** Open printable version */
  public static async openPrintablePDF(
    invoiceData: InvoiceData,
  ): Promise<void> {
    // Load logo for printable version
    let logoBase64 = "";
    try {
      logoBase64 = await this.loadLogoAsBase64();
    } catch {
      console.warn("Logo not found for printable version");
    }

    const baseHtml = buildInvoiceHTML(invoiceData);
    const htmlWithLogo = baseHtml;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      throw new Error(
        "Failed to open print window. Please allow popups for this site.",
      );
    }

    printWindow.document.write(htmlWithLogo);
    printWindow.document.close();

    await new Promise((resolve) => {
      const checkReady = () => {
        if (printWindow.document.readyState === "complete") {
          const logoContainer =
            printWindow.document.querySelector(".logo-container");
          if (logoContainer && logoBase64) {
            const img = printWindow.document.createElement("img");
            img.src = logoBase64;
            img.alt = "COMPUTER WORLD";
            img.className = "company-logo";
            img.style.height = "100px";
            img.style.width = "200px";
            img.style.marginBottom = "-5px";
            img.style.marginLeft = "-50px";
            img.style.marginTop = "-40px";
            img.style.display = "block";
            img.crossOrigin = "anonymous";

            logoContainer.innerHTML = "";
            logoContainer.appendChild(img);
          }
          setTimeout(resolve, 500);
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });

    printWindow.focus();
    printWindow.print();
  }
}

//  <div class="tagline">
//    $
//    {escapeHtml(
//      safeSettings.fbPage
//        ? `Follow us: ${safeSettings.fbPage}`
//        : "Your Trusted Technology Partner"
//    )}
//  </div>;
// <div class="company-meta">
//   <div>${escapeHtml(safeSettings.address || "Sarishabari, Jamalpur")}</div>
//   <div>Phone: ${safeSettings.phone || "+880 XXXX-XXXXXX"}</div>
//   <div>Email: ${safeSettings.email || "store@computerworld.com"}</div>
// </div>;
