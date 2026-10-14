import PDFDocument from 'pdfkit';

function toPdfText(value) {
  return String(value ?? '-')
    .replace(/₹/g, 'INR ')
    .replace(/[–—]/g, '-')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?');
}

export function sendPdfDocument(res, { filename, title, subtitle, sections }) {
  const document = new PDFDocument({ size: 'A4', margin: 48 });
  res
    .status(200)
    .type('application/pdf')
    .set('Content-Disposition', `attachment; filename="${filename}"`);

  document.pipe(res);
  document.font('Helvetica-Bold').fontSize(19).fillColor('#00245C').text(toPdfText(title));
  if (subtitle) {
    document.moveDown(0.4).font('Helvetica').fontSize(9).fillColor('#5B6472').text(toPdfText(subtitle));
  }

  for (const section of sections) {
    document.moveDown(0.8).font('Helvetica-Bold').fontSize(12).fillColor('#00245C').text(toPdfText(section.title));
    for (const item of section.items) {
      if (document.y > document.page.height - document.page.margins.bottom - 32) {
        document.addPage();
      }
      document
        .font(item.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(item.bold ? 9.5 : 8.5)
        .fillColor(item.bold ? '#1F2937' : '#374151')
        .text(toPdfText(item.text), { indent: item.indent || 0, lineGap: 2 });
    }
  }

  document.end();
}