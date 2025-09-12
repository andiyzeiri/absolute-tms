import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoicePDF = (invoices) => {
  console.log('PDF Generator called with new column structure:', invoices);
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  let yPosition = 20;

  // Company header
  pdf.setFontSize(20);
  pdf.setFont(undefined, 'bold');
  pdf.text('Absolute Trucking Inc', pageWidth / 2, yPosition, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');
  yPosition += 8;
  pdf.text('2250 Devon Ave Suite 356, Des Plaines IL 60018', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;
  pdf.text('Phone: 847-436-1677 | Email: redi@absolutetrucking.net', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 20;

  if (invoices.length === 1) {
    // Single invoice - detailed format
    const invoice = invoices[0];
    
    // Invoice header
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text(`Invoice ${invoice.invoiceNumber}`, 20, yPosition);
    
    // Invoice date on the right
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    const invoiceDate = new Date(invoice.issueDate).toLocaleDateString();
    pdf.text(`Date: ${invoiceDate}`, pageWidth - 60, yPosition);
    
    yPosition += 15;

    // Customer information
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Bill To:', 20, yPosition);
    
    pdf.setFont(undefined, 'normal');
    yPosition += 8;
    pdf.text(invoice.customer, 20, yPosition);
    
    if (invoice.customerEmail) {
      yPosition += 6;
      pdf.text(invoice.customerEmail, 20, yPosition);
    }
    
    // Load number on the right
    if (invoice.loadNumber) {
      pdf.text(`Load: ${invoice.loadNumber}`, pageWidth - 80, yPosition - 8);
    }
    
    yPosition += 15;

    // Services table with new column structure
    console.log('Creating table with NEW columns: Date, Service, Load #, Description, Quantity, Amount, Total');
    const tableColumns = ['Date', 'Service', 'Load #', 'Description', 'Quantity', 'Amount', 'Total'];
    const tableRows = [];

    // Add services
    if (invoice.services && invoice.services.length > 0) {
      invoice.services.forEach(service => {
        tableRows.push([
          new Date(invoice.issueDate).toLocaleDateString(),
          'Transportation',
          invoice.loadNumber || '',
          service.description,
          service.quantity.toString(),
          `$${service.amount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`,
          `$${service.amount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`
        ]);
      });
    } else {
      // Default service based on invoice data
      const description = invoice.loadNumber ? 
        `Transportation Services - Load ${invoice.loadNumber}` : 
        'Transportation Services';
      
      tableRows.push([
        new Date(invoice.issueDate).toLocaleDateString(),
        'Transportation',
        invoice.loadNumber || '',
        description,
        '1',
        `$${invoice.amount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`,
        `$${invoice.amount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`
      ]);
    }

    // Add tax row
    if (invoice.taxAmount > 0) {
      tableRows.push([
        '',
        '',
        '',
        'Tax (13%)',
        '',
        `$${invoice.taxAmount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`,
        `$${invoice.taxAmount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`
      ]);
    }

    autoTable(pdf, {
      startY: yPosition,
      head: [tableColumns],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 55 },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 25, halign: 'right' }
      }
    });

    yPosition = pdf.lastAutoTable.finalY + 10;

    // Total section
    const totalStartX = pageWidth - 80;
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Total Amount:', totalStartX - 30, yPosition);
    pdf.text(`$${invoice.totalAmount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, totalStartX, yPosition);
    
    yPosition += 10;
    
    // Due date underneath total
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    const dueDate = new Date(invoice.dueDate).toLocaleDateString();
    pdf.text('Due Date:', totalStartX - 30, yPosition);
    pdf.setFont(undefined, 'bold');
    pdf.text(dueDate, totalStartX, yPosition);
    
    yPosition += 15;

    // Payment status
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    
    let statusText = '';
    let statusColor = [0, 0, 0];
    
    switch (invoice.status) {
      case 'paid':
        statusText = `PAID - ${new Date(invoice.paidDate).toLocaleDateString()}`;
        statusColor = [5, 150, 105];
        break;
      case 'pending':
        statusText = `DUE: ${new Date(invoice.dueDate).toLocaleDateString()}`;
        statusColor = [217, 119, 6];
        break;
      case 'overdue':
        statusText = `OVERDUE: ${new Date(invoice.dueDate).toLocaleDateString()}`;
        statusColor = [220, 38, 38];
        break;
      default:
        statusText = `Due: ${new Date(invoice.dueDate).toLocaleDateString()}`;
    }
    
    pdf.setTextColor(...statusColor);
    pdf.setFont(undefined, 'bold');
    pdf.text(statusText, totalStartX - 30, yPosition);
    pdf.setTextColor(0, 0, 0);
    
    if (invoice.notes) {
      yPosition += 20;
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      pdf.text('Notes:', 20, yPosition);
      yPosition += 5;
      
      const notes = pdf.splitTextToSize(invoice.notes, pageWidth - 40);
      pdf.text(notes, 20, yPosition);
    }
    
  } else {
    // Multiple invoices - summary table format
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Invoice Summary', 20, yPosition);
    yPosition += 10;

    // Create summary table with new column structure
    console.log('Creating MULTIPLE invoice table with NEW columns: Date, Service, Load #, Description, Quantity, Amount, Total');
    const tableColumns = ['Date', 'Service', 'Load #', 'Description', 'Quantity', 'Amount', 'Total'];
    const tableRows = [];

    invoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.issueDate).toLocaleDateString();
      
      // Get service description from the invoice services or create default
      let description = 'Transportation Services';
      if (invoice.services && invoice.services.length > 0) {
        description = invoice.services[0].description;
      } else if (invoice.loadNumber) {
        description = `Transportation Services - Load ${invoice.loadNumber}`;
      }

      tableRows.push([
        invoiceDate,
        'Transportation',
        invoice.loadNumber || '',
        description,
        '1',
        `$${invoice.amount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`,
        `$${invoice.totalAmount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`
      ]);
    });

    autoTable(pdf, {
      startY: yPosition,
      head: [tableColumns],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 55 },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 25, halign: 'right' }
      }
    });

    yPosition = pdf.lastAutoTable.finalY + 15;

    // Total summary
    const totalAmount = invoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
    const totalStartX = pageWidth - 80;
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Total Amount:', totalStartX - 30, yPosition);
    pdf.text(`$${totalAmount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, totalStartX, yPosition);
    
    yPosition += 10;
    
    // Due dates for multiple invoices (show range or latest)
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    const dueDates = invoices.map(inv => new Date(inv.dueDate));
    const earliestDue = new Date(Math.min(...dueDates));
    const latestDue = new Date(Math.max(...dueDates));
    
    if (earliestDue.getTime() === latestDue.getTime()) {
      // All invoices have same due date
      pdf.text('Due Date:', totalStartX - 30, yPosition);
      pdf.setFont(undefined, 'bold');
      pdf.text(earliestDue.toLocaleDateString(), totalStartX, yPosition);
    } else {
      // Different due dates - show range
      pdf.text('Due Dates:', totalStartX - 30, yPosition);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${earliestDue.toLocaleDateString()} - ${latestDue.toLocaleDateString()}`, totalStartX, yPosition);
    }
  }

  // Footer
  yPosition += 20;
  pdf.setFontSize(8);
  pdf.setFont(undefined, 'italic');
  pdf.text('Thank you for your business!', 20, yPosition);

  return pdf;
};

export const downloadInvoicesPDF = (invoices, filename = 'invoices.pdf') => {
  console.log('DownloadInvoicesPDF called - using NEW format');
  const pdf = generateInvoicePDF(invoices);
  pdf.save(filename);
};

export const previewInvoicesPDF = (invoices) => {
  const pdf = generateInvoicePDF(invoices);
  const pdfDataUri = pdf.output('datauristring');
  const newWindow = window.open();
  newWindow.document.write(`
    <iframe width='100%' height='100%' src='${pdfDataUri}'></iframe>
  `);
};