import React, { useRef, useState } from 'react';
import { BusinessInfo, Sale } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { SunshineLogo } from '../Common/SunshineLogo';
import { Printer, Download, X, CheckCircle2, Loader2, Trash2, KeyRound, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface InvoiceModalProps {
  sale: Sale | null;
  businessInfo: BusinessInfo;
  onClose: () => void;
  onDeleteSale?: (saleId: string) => void;
  triggerConfetti?: boolean;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  sale,
  businessInfo,
  onClose,
  onDeleteSale,
  triggerConfetti = false,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Delete Bill Password Protection State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handleConfirmDeleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale) return;
    const cleanPass = deletePassword.trim();
    if (cleanPass === '23571113' || cleanPass === 'Sunil369@' || cleanPass === 'Sunil 359@') {
      if (onDeleteSale) {
        onDeleteSale(sale.id);
      }
      setIsDeleteModalOpen(false);
      onClose();
    } else {
      setDeleteError('Invalid Password!');
    }
  };

  React.useEffect(() => {
    if (triggerConfetti) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [triggerConfetti]);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current || isDownloading) return;
    try {
      setIsDownloading(true);
      const element = printRef.current;

      // Helper to sanitize any unsupported oklch color strings to standard rgb
      const sanitizeOklch = (str: string): string => {
        if (!str || !str.includes('oklch')) return str;
        return str.replace(/oklch\s*\([^)]+\)/gi, (match) => {
          try {
            const temp = document.createElement('div');
            temp.style.color = match;
            temp.style.display = 'none';
            document.body.appendChild(temp);
            const computed = window.getComputedStyle(temp).color;
            document.body.removeChild(temp);
            if (computed && !computed.includes('oklch')) {
              return computed;
            }
          } catch (e) {
            // fallback
          }
          return 'rgb(0, 0, 0)';
        });
      };

      // Render DOM element to canvas with crisp scale
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // 1. Sanitize all <style> tags
          clonedDoc.querySelectorAll('style').forEach((styleEl) => {
            if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
              styleEl.textContent = sanitizeOklch(styleEl.textContent);
            }
          });

          // 2. Sanitize inline styles
          clonedDoc.querySelectorAll('*').forEach((node) => {
            const el = node as HTMLElement;
            if (el.style && el.style.cssText && el.style.cssText.includes('oklch')) {
              el.style.cssText = sanitizeOklch(el.style.cssText);
            }
          });

          // 3. Format printable bill container for pure crisp white page
          const el = clonedDoc.getElementById('printable-bill');
          if (el) {
            el.style.boxShadow = 'none';
            el.style.border = '1px solid #1f2937';
          }
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      
      // Standard A4 format PDF (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
      
      // Fit neatly on A4 with 10mm side margin
      const margin = 10;
      const printWidth = pageWidth - (margin * 2); // 190 mm
      const printHeight = (canvas.height * printWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', margin, margin, printWidth, Math.min(printHeight, pageHeight - (margin * 2)));

      const fileName = `Invoice_${sale.invoiceNo}.pdf`;

      // Primary download trigger
      pdf.save(fileName);

      // Backup trigger for browser preview environments
      try {
        const dataUrl = pdf.output('datauristring');
        const downloadLink = document.createElement('a');
        downloadLink.href = dataUrl;
        downloadLink.download = fileName;
        downloadLink.target = '_blank';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        setTimeout(() => {
          if (document.body.contains(downloadLink)) {
            document.body.removeChild(downloadLink);
          }
        }, 1500);
      } catch (dataErr) {
        console.warn('Data URL backup download notice:', dataErr);
      }

    } catch (err) {
      console.error('PDF download error:', err);
      // Fallback: trigger native browser print dialog to save as PDF
      alert('Opening print window where you can save as PDF...');
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const isDefaultLogo = !businessInfo.logoUrl || businessInfo.logoUrl === '/sunshine-logo.svg';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Main Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 bg-white text-black border-b-2 border-black print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white text-black border-2 border-black rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="font-black text-base text-black">Invoice / Bill Receipt</h3>
              <p className="text-xs text-black font-bold">Bill No: {sale.invoiceNo}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-black hover:bg-neutral-800 disabled:bg-neutral-600 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer border border-black"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>Download PDF (A4)</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer border border-black"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Print Bill</span>
            </button>

            {onDeleteSale && (
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(true);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-neutral-100 text-black font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer border-2 border-black"
                title="Delete this Bill"
              >
                <Trash2 className="w-4 h-4 text-black" />
                <span>Delete</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-black hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer border-2 border-black ml-auto sm:ml-0"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Bill Area */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-neutral-100 flex justify-center">
          
          {/* A4 Formatted Clean Balanced Invoice */}
          <div
            ref={printRef}
            id="printable-bill"
            className="invoice-a4-container bg-white text-black border border-black shadow-md p-6 sm:p-8 w-full max-w-[190mm] min-h-[260mm] flex flex-col justify-between font-sans text-xs relative select-text"
          >
            <div>
              {/* Header Section */}
              <div className="border-b-2 border-black pb-4 mb-4">
                <div className="flex items-start justify-between gap-4">
                  
                  {/* Left: Logo & Business Branding */}
                  <div className="flex items-start space-x-3.5 flex-1 pr-2">
                    {businessInfo.showLogoOnInvoice !== false && (
                      <div className="shrink-0 pt-0.5">
                        {isDefaultLogo ? (
                          <SunshineLogo size={56} className="h-14 w-14" />
                        ) : (
                          <img
                            src={businessInfo.logoUrl}
                            alt="Institute Logo"
                            crossOrigin="anonymous"
                            className="h-14 w-14 object-contain rounded-full border border-black bg-white p-0.5"
                          />
                        )}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h1 className="text-base sm:text-lg font-black text-black leading-snug tracking-tight">
                        {businessInfo.name}
                      </h1>
                      <p className="text-xs text-black font-bold mt-1">
                        📍 {businessInfo.location} | 📞 Contact: {businessInfo.contact}
                      </p>
                      <p className="text-[11px] text-black font-semibold mt-0.5">
                        ✉️ Email: {businessInfo.email || 'sunshinecomputer2080@gmail.com'} | Founder: {businessInfo.founder || 'Sunil Sharma'}
                        {businessInfo.panVatNo && ` | PAN/VAT: ${businessInfo.panVatNo}`}
                      </p>
                      <div className="mt-1 text-[11px] font-bold text-neutral-800">
                        Category: <span className="font-black text-black">{sale.saleType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Clean TAX INVOICE / BILL Header (No Box) */}
                  <div className="text-right flex flex-col items-end shrink-0 pl-2">
                    <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-black">
                      TAX INVOICE / BILL
                    </h2>
                    <p className="font-black text-sm text-black mt-1"># {sale.invoiceNo}</p>
                    <p className="text-[11px] text-black font-medium mt-0.5">{formatDateTime(sale.date)}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info & Payment Details (Clean Layout, No Boxes) */}
              <div className="grid grid-cols-2 gap-4 pb-3 mb-4 border-b border-neutral-300 text-black text-xs">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-neutral-700 font-bold">Billed To (Customer):</p>
                  <p className="font-black text-sm text-black mt-0.5">{sale.customerName}</p>
                  <p className="text-xs text-neutral-800 font-medium mt-0.5">
                    Phone: <span className="font-bold text-black">{sale.customerPhone || 'N/A'}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-neutral-700 font-bold">Payment Details:</p>
                  <p className="font-black text-sm text-black mt-0.5">
                    {sale.paymentMethod} &bull; <span className="font-black uppercase">{sale.paymentStatus}</span>
                  </p>
                  <p className="text-xs text-neutral-800 font-medium mt-0.5">
                    Mode: <span className="font-bold text-black">{sale.paymentMethod}</span>
                  </p>
                </div>
              </div>

              {/* Items Table - Clean Black Text on White, No Black Background */}
              <div className="mb-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-y-2 border-black text-black text-[11px] font-black uppercase tracking-wider bg-transparent">
                      <th className="py-2.5 px-2 text-left w-8 font-black">#</th>
                      <th className="py-2.5 px-2 text-left font-black">Particulars / Description</th>
                      <th className="py-2.5 px-2 text-center w-14 font-black">Qty</th>
                      <th className="py-2.5 px-2 text-right w-24 font-black">Rate</th>
                      <th className="py-2.5 px-2 text-right w-28 font-black">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-black text-xs">
                    {sale.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50/50">
                        <td className="py-2 px-2 font-bold text-neutral-700">{idx + 1}</td>
                        <td className="py-2 px-2 font-black text-black">
                          {item.productName}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-black">{item.qty}</td>
                        <td className="py-2 px-2 text-right font-medium text-black">{formatCurrency(item.sellingRate)}</td>
                        <td className="py-2 px-2 text-right font-black text-black">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Notes Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-3 border-t-2 border-black text-black text-xs">
                
                {/* Notes (Left Side) */}
                <div className="w-full sm:w-1/2 pr-0 sm:pr-4">
                  {sale.notes ? (
                    <div className="p-2.5 bg-neutral-50 rounded text-xs text-black border border-neutral-300">
                      <span className="font-black">Note:</span> {sale.notes}
                    </div>
                  ) : (
                    <div className="text-[11px] text-neutral-500 italic">
                      Official computer generated receipt for Sunshine Computer Institute & Framing House.
                    </div>
                  )}
                </div>

                {/* Calculation Details (Right Side) */}
                <div className="w-full sm:w-1/2 text-right text-xs space-y-1.5">
                  <div className="flex justify-between py-0.5">
                    <span className="text-neutral-700 font-bold">Subtotal:</span>
                    <span className="font-bold text-black">{formatCurrency(sale.subtotal)}</span>
                  </div>

                  {sale.discountAmount > 0 && (
                    <div className="flex justify-between py-0.5 text-black">
                      <span className="font-bold text-neutral-700">Discount:</span>
                      <span className="font-bold text-black">- {formatCurrency(sale.discountAmount)}</span>
                    </div>
                  )}

                  {sale.taxAmount > 0 && (
                    <div className="flex justify-between py-0.5 text-black">
                      <span className="font-bold text-neutral-700">VAT ({sale.taxPercent}%):</span>
                      <span className="font-bold text-black">{formatCurrency(sale.taxAmount)}</span>
                    </div>
                  )}

                  {sale.previousDueAdded && sale.previousDueAdded > 0 ? (
                    <div className="flex justify-between py-1 text-black font-black border-y border-dashed border-neutral-400">
                      <span>Previous Due Balance Added:</span>
                      <span>+ {formatCurrency(sale.previousDueAdded)}</span>
                    </div>
                  ) : null}

                  {/* Grand Total */}
                  <div className="flex justify-between py-2 border-y-2 border-black font-black text-sm text-black my-1">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(sale.grandTotal)}</span>
                  </div>

                  {/* Paid Amount */}
                  <div className="flex justify-between py-0.5 text-black font-bold">
                    <span className="text-neutral-800">Paid Amount:</span>
                    <span className="font-black text-black">{formatCurrency(sale.paidAmount)}</span>
                  </div>

                  {/* Due Amount - With Clear Line Above */}
                  {sale.dueAmount > 0 ? (
                    <div className="flex justify-between py-1.5 font-black text-xs text-black border-t-2 border-black mt-1.5 pt-1.5">
                      <span>Due Amount:</span>
                      <span>{formatCurrency(sale.dueAmount)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between py-1 text-neutral-700 font-bold text-[11px] border-t border-neutral-300 mt-1 pt-1">
                      <span>Balance Status:</span>
                      <span className="font-black text-black">PAID IN FULL</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Footer & Signatures */}
            <div className="mt-8 pt-4 border-t border-dashed border-neutral-400">
              <div className="flex justify-end text-center text-xs text-black mb-4">
                <div className="flex flex-col items-center justify-end">
                  <div className="border-b border-black w-40 mb-1"></div>
                  <span className="font-black text-black">
                    Received By: {businessInfo.founder || 'Sunil Sharma'}
                  </span>
                </div>
              </div>

              {businessInfo.invoiceNotice && (
                <div className="text-center text-[11px] text-neutral-800 pt-2 border-t border-neutral-200">
                  <p className="font-bold">{businessInfo.invoiceNotice}</p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Password Protected Delete Bill Modal */}
      {isDeleteModalOpen && sale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 border-2 border-black max-w-md w-full space-y-4 shadow-2xl text-black">
            <div className="flex items-center space-x-3 text-black">
              <div className="p-3 bg-white border-2 border-black rounded-2xl">
                <KeyRound className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-black text-base text-black">Security Authorization Required</h3>
                <p className="text-xs text-black font-bold">Deleting bill/invoice record requires password.</p>
              </div>
            </div>

            <p className="text-xs font-black text-black bg-neutral-50 p-3 rounded-xl border border-neutral-300">
              Bill: <span className="text-black font-black">#{sale.invoiceNo}</span> ({sale.customerName} - {formatCurrency(sale.grandTotal)})
            </p>

            <form onSubmit={handleConfirmDeleteSale} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-black mb-1">Enter Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter security password..."
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError('');
                  }}
                  className="w-full px-3.5 py-2.5 border-2 border-black rounded-xl text-xs font-black text-black focus:outline-none"
                />
              </div>

              {deleteError && (
                <div className="p-2.5 bg-black text-white rounded-xl text-xs font-black flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-white shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                  className="px-4 py-2 border-2 border-black text-black text-xs font-black rounded-xl cursor-pointer hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer border border-black"
                >
                  Delete Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
