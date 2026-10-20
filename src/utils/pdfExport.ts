import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';

export interface ExportPdfOptions {
  fileName?: string;
  quality?: number;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Xuất một HTML Element thành file PDF sắc nét chuẩn A4 và tự động tải về máy
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: ExportPdfOptions = {}
): Promise<boolean> {
  const fileName = options.fileName || 'tai-lieu-hudesign.pdf';
  const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

  try {
    // 1. Render element thành canvas với tỷ lệ pixel cao (pixelRatio: 2) để chữ và hình ảnh in ra sắc nét
    // Đặt cố định kích thước chuẩn A4 (800px đối với portrait, 1120px đối với landscape) để tránh bị tràn hoặc co rúm
    const isLandscape = options.orientation === 'landscape';
    const targetWidth = isLandscape ? 1120 : 800;

    const canvas = await toCanvas(element, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
      style: {
        transform: 'none',
        margin: '0',
        width: `${targetWidth}px`,
        maxWidth: `${targetWidth}px`,
        boxSizing: 'border-box',
      },
      filter: (node) => {
        // Bỏ qua các phần tử có class no-print
        if (node instanceof HTMLElement && node.classList.contains('no-print')) {
          return false;
        }
        return true;
      },
    });

    // 2. Kích thước A4 tính bằng milimet: 210 x 297 mm
    const pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Kích thước canvas thực tế
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Chuyển canvas sang dạng JPEG chất lượng cao
    const imgData = canvas.toDataURL('image/jpeg', options.quality ?? 0.95);

    let heightLeft = imgHeight;
    let position = 0;

    // Trang đầu tiên
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Nếu tài liệu dài hơn 1 trang A4, tự động thêm các trang tiếp theo
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // 3. Tải file về máy tính / điện thoại của người dùng
    pdf.save(finalFileName);
    return true;
  } catch (error) {
    console.error('[PDF Export Error]:', error);
    // Fallback: nếu canvas gặp lỗi do CORS ảnh, thử mở iframe in trực tiếp
    return printElementCleanly(element, finalFileName);
  }
}

/**
 * In sạch một HTML element thông qua iframe chuyên dụng
 * Giải quyết triệt để lỗi window.print() bị chặn trong iframe sandbox của Google AI Studio
 */
export function printElementCleanly(element: HTMLElement, documentTitle: string = 'In tài liệu'): boolean {
  try {
    // Thu thập toàn bộ style và link CSS hiện tại của ứng dụng
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((style) => style.outerHTML)
      .join('\n');

    // Tạo hidden iframe chuyên biệt để in
    let printFrame = document.getElementById('hu_design_print_frame') as HTMLIFrameElement | null;
    if (printFrame) {
      document.body.removeChild(printFrame);
    }

    printFrame = document.createElement('iframe');
    printFrame.id = 'hu_design_print_frame';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.visibility = 'hidden';

    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      // Nếu không tạo được frame doc, fallback sang window.print() thông thường
      window.print();
      return true;
    }

    // Viết nội dung tài liệu vào frame kèm style A4 chuẩn
    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${documentTitle}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            *, *::before, *::after {
              box-sizing: border-box !important;
            }
            body {
              background: #ffffff !important;
              color: #111827 !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
            .printable-plan-document,
            .quotation-printable {
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            .quotation-printable table {
              width: 100% !important;
              max-width: 100% !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
            }
            .quotation-printable th,
            .quotation-printable td {
              word-break: break-word !important;
            }
            tr {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${element.outerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    frameDoc.close();
    return true;
  } catch (err) {
    console.error('[Print Element Cleanly Error]:', err);
    // Cuối cùng nếu các giải pháp sandbox bị chặn, gọi window.print()
    window.print();
    return false;
  }
}
