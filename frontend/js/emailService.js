// emailService.js
// Handles email sending functionality for invoices and notifications

class EmailService {
    
    /**
     * Send invoice via email to customer with backend integration
     * @param {string} customerEmail - Customer email address
     * @param {string} customerName - Customer name
     * @param {Object} invoiceData - Invoice data object
     * @param {string} invoiceHTML - Generated invoice HTML
     * @returns {Promise<Object>} Invoice delivery result
     */
    static async sendInvoiceByEmail(customerEmail, customerName, invoiceData, invoiceHTML) {
        console.log('Processing invoice delivery for:', customerEmail);
        console.log('Invoice data:', invoiceData);
        
        try {
            // Try backend email service first
            const backendResult = await this.sendViaBackendEmail(customerEmail, customerName, invoiceData, invoiceHTML);
            if (backendResult.success) {
                return backendResult;
            }
            
            // Fallback to client-side delivery if backend fails
            console.log('📧 Backend email failed - using client-side delivery');
            
            // Save invoice for future access
            await this.saveInvoiceLocally(customerEmail, customerName, invoiceData, invoiceHTML);
            
            // Show invoice immediately
            this.openInvoiceInNewWindow(invoiceHTML, invoiceData);
            
            // Show helpful notification with next steps
            this.showClientSideDeliveryNotification(customerEmail, invoiceData);
            
            return { 
                success: true, 
                method: 'client-side-fallback', 
                message: 'Invoice delivered via browser popup and saved locally',
                actions: ['popup_opened', 'saved_locally', 'notification_shown']
            };
            
        } catch (error) {
            console.error('Invoice delivery failed:', error);
            this.showEmailErrorNotification(customerEmail);
            return { success: false, method: 'error', error: error.message };
        }
    }

    /**
     * Send email via Spring Boot backend service
     * @param {string} customerEmail - Customer email address
     * @param {string} customerName - Customer name
     * @param {Object} invoiceData - Invoice data object
     * @param {string} invoiceHTML - Generated invoice HTML
     * @returns {Promise<Object>} Backend email result
     */
    static async sendViaBackendEmail(customerEmail, customerName, invoiceData, invoiceHTML) {
        try {
            console.log('🔄 Attempting Spring Boot email service...');
            
            // Generate PDF for attachment
            const pdfBase64 = await this.generateInvoicePDFBase64(invoiceHTML);
            
            // Prepare Spring Boot email request (matches EmailRequest DTO)
            const emailRequest = {
                to: customerEmail,
                toName: customerName || 'Customer',
                subject: `Your Booklify Invoice - Order #${invoiceData.order.id}`,
                html: this.generateInvoiceEmailTemplate(customerName, invoiceData, invoiceHTML),
                attachments: pdfBase64 ? [{
                    filename: `booklify-invoice-${invoiceData.order.id}.pdf`,
                    content: pdfBase64,
                    contentType: 'application/pdf',
                    encoding: 'base64'
                }] : []
            };
            
            console.log('📤 Sending email request to Spring Boot backend...');
            console.log('Email request:', {
                to: emailRequest.to,
                subject: emailRequest.subject,
                attachments: emailRequest.attachments ? emailRequest.attachments.length : 0
            });
            
            // Send to Spring Boot API endpoint
            const response = await fetch('http://localhost:8081/api/emails/send-invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('booklifyToken')}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(emailRequest)
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                    console.error('Backend error response:', errorData);
                } catch (e) {
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                    console.error('Backend error text:', errorText);
                }
                throw new Error(`Spring Boot email service failed: ${errorMessage}`);
            }
            
            const result = await response.json();
            console.log('✅ Spring Boot email sent successfully:', result);
            
            // Validate Spring Boot response format
            if (result.success) {
                // Show success notification with Spring Boot message ID
                this.showEmailSuccessNotification(customerEmail, invoiceData.order.id, result.messageId);
                
                // Mark as sent in tracking
                this.markInvoiceAsSent(invoiceData.order.id, result.messageId);
                
                return { 
                    success: true, 
                    method: 'spring-boot-email', 
                    result: result,
                    messageId: result.messageId,
                    timestamp: result.timestamp,
                    message: 'Invoice sent successfully via Spring Boot email service'
                };
            } else {
                throw new Error(`Email sending failed: ${result.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.warn('Spring Boot email service failed:', error.message);
            return { 
                success: false, 
                method: 'spring-boot-email', 
                error: error.message 
            };
        }
    }
    
    /**
     * Generate email template with invoice content
     * @param {string} customerName - Customer name
     * @param {Object} invoiceData - Invoice data object
     * @param {string} invoiceHTML - Generated invoice HTML
     * @returns {string} Email HTML template
     */
    static generateInvoiceEmailTemplate(customerName, invoiceData, invoiceHTML) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Your Booklify Invoice</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .email-container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6f42c1, #4f46e5); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .highlight { background: #e7f3ff; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
        .btn { display: inline-block; padding: 12px 24px; background: #6f42c1; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>📚 Booklify Invoice</h1>
            <p>Thank you for your purchase!</p>
        </div>
        
        <div class="content">
            <h2>Dear ${customerName},</h2>
            
            <p>We're excited to confirm that your order has been successfully processed! 🎉</p>
            
            <div class="highlight">
                <strong>Order Summary:</strong><br>
                📋 Order #: ${invoiceData.order.id}<br>
                📅 Date: ${invoiceData.invoice.date}<br>
                💰 Total: ${invoiceData.totals.currency}${invoiceData.totals.totalAmount.toFixed(2)}<br>
                📦 Status: ${invoiceData.invoice.status}
            </div>
            
            <p><strong>📚 Books Ordered:</strong></p>
            <ul>
                ${invoiceData.items.map(item => 
                    `<li>${item.description} by ${item.author} - ${invoiceData.totals.currency}${item.total.toFixed(2)}</li>`
                ).join('')}
            </ul>
            
            <p>Your invoice is attached as a PDF for your records. You can also access your order history anytime by logging into your Booklify account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/pages/orders.html" class="btn">View My Orders</a>
            </div>
            
            <p>If you have any questions about your order, please don't hesitate to contact our support team.</p>
            
            <p>Happy reading! 📖</p>
            
            <p>Best regards,<br>
            <strong>The Booklify Team</strong></p>
        </div>
        
        <div class="footer">
            <p>Booklify - Your Digital Bookstore<br>
            Cape Town, South Africa | support@booklify.com<br>
            <a href="http://localhost:3000">Visit Booklify</a></p>
        </div>
    </div>
</body>
</html>`;
    }
    
    /**
     * Generate PDF as base64 for email attachment
     * @param {string} invoiceHTML - Invoice HTML content
     * @returns {Promise<string>} Base64 encoded PDF content
     */
    static async generateInvoicePDFBase64(invoiceHTML) {
        try {
            console.log('📄 Generating PDF for email attachment...');
            
            // Load jsPDF if not already loaded
            if (!window.jsPDF) {
                await this.loadJSPDF();
            }
            
            // Create PDF from HTML
            const { jsPDF } = window.jsPDF;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // Create temporary container for rendering
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = invoiceHTML;
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.width = '210mm'; // A4 width
            document.body.appendChild(tempDiv);
            
            // Generate PDF from HTML element
            await new Promise((resolve) => {
                pdf.html(tempDiv, {
                    callback: function(pdf) {
                        resolve();
                    },
                    margin: [10, 10, 10, 10],
                    autoPaging: 'text',
                    width: 190,
                    windowWidth: 800
                });
            });
            
            // Clean up
            document.body.removeChild(tempDiv);
            
            // Return base64 content (without data URI prefix)
            const pdfData = pdf.output('datauristring');
            return pdfData.split(',')[1];
            
        } catch (error) {
            console.error('Error generating PDF for email:', error);
            return null;
        }
    }

    /**
     * Load jsPDF library dynamically
     * @returns {Promise} Load promise
     */
    static async loadJSPDF() {
        return new Promise((resolve, reject) => {
            if (window.jsPDF) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                console.log('✅ jsPDF loaded');
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Mark invoice as sent to avoid duplicates
     * @param {number} orderId - Order ID
     */
    static markInvoiceAsSent(orderId) {
        try {
            const sentInvoices = JSON.parse(localStorage.getItem('booklify_sent_invoices') || '[]');
            const sentRecord = {
                orderId: orderId.toString(),
                timestamp: new Date().toISOString(),
                method: 'email'
            };
            
            // Remove any existing record for this order
            const filtered = sentInvoices.filter(inv => inv.orderId !== orderId.toString());
            filtered.push(sentRecord);
            
            localStorage.setItem('booklify_sent_invoices', JSON.stringify(filtered));
            console.log('📝 Marked invoice as sent:', orderId);
            
        } catch (error) {
            console.error('Error marking invoice as sent:', error);
        }
    }
    
    /**
     * Save invoice locally for future access
     * @param {string} customerEmail - Customer email address
     * @param {string} customerName - Customer name
     * @param {Object} invoiceData - Invoice data object
     * @param {string} invoiceHTML - Generated invoice HTML
     * @returns {Promise<Object>} Save result
     */
    static async saveInvoiceLocally(customerEmail, customerName, invoiceData, invoiceHTML) {
        try {
            console.log('💾 Saving invoice locally for:', customerEmail);
            
            // Get existing invoices
            const savedInvoices = JSON.parse(localStorage.getItem('booklify_saved_invoices') || '[]');
            
            // Check if invoice already exists
            const existingIndex = savedInvoices.findIndex(inv => inv.orderId === invoiceData.order.id);
            
            const invoiceRecord = {
                orderId: invoiceData.order.id,
                customerEmail,
                customerName,
                invoiceData,
                invoiceHTML,
                timestamp: new Date().toISOString(),
                deliveryMethod: 'client-side',
                accessed: false
            };
            
            if (existingIndex >= 0) {
                // Update existing record
                savedInvoices[existingIndex] = invoiceRecord;
                console.log('📝 Updated existing invoice record');
            } else {
                // Add new record
                savedInvoices.push(invoiceRecord);
                console.log('➕ Added new invoice record');
            }
            
            localStorage.setItem('booklify_saved_invoices', JSON.stringify(savedInvoices));
            
            return { success: true, action: existingIndex >= 0 ? 'updated' : 'created' };
            
        } catch (error) {
            console.error('Failed to save invoice locally:', error);
            throw error;
        }
    }

    /**
     * Show notification for client-side invoice delivery
     * @param {string} email - Customer email
     * @param {Object} invoiceData - Invoice data
     */
    static showClientSideDeliveryNotification(email, invoiceData) {
        const message = `Your invoice for Order #${invoiceData.order.id} (${invoiceData.totals.currency}${invoiceData.totals.totalAmount.toFixed(2)}) is ready!`;
        
        this.createNotification('success', '🧾 Invoice Ready!', message, 12000, [
            {
                text: '📧 Setup Email',
                action: () => this.showEmailSetupGuide(email, invoiceData)
            },
            {
                text: '📱 Share Invoice',
                action: () => this.shareInvoice(invoiceData)
            },
            {
                text: '📂 View All Orders',
                action: () => window.location.href = '../pages/orders.html'
            }
        ]);
    }

    /**
     * Show email setup guide for users
     * @param {string} email - Customer email
     * @param {Object} invoiceData - Invoice data
     */
    static showEmailSetupGuide(email, invoiceData) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">📧 Email Setup Guide</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Email backend not configured.</strong> Here are your options to receive invoices:
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <h6 class="card-title">🔗 Share via Link</h6>
                                        <p class="card-text">Copy a shareable link to your invoice that you can send via any messaging app.</p>
                                        <button class="btn btn-outline-primary btn-sm" onclick="EmailService.copyInvoiceLink(${invoiceData.order.id})">
                                            Copy Link
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <h6 class="card-title">💾 Download PDF</h6>
                                        <p class="card-text">Download the invoice as a PDF file to save or email manually.</p>
                                        <button class="btn btn-outline-success btn-sm" onclick="EmailService.downloadInvoiceFromStorage(${invoiceData.order.id})">
                                            Download PDF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <h6>📧 Enable Automatic Email Delivery</h6>
                        <p class="text-muted">To receive invoices automatically in your email:</p>
                        <div class="alert alert-info">
                            <strong>📖 Complete Setup Guide Available!</strong><br>
                            Check the <code>EMAIL_SETUP_GUIDE.md</code> file for detailed implementation instructions.
                        </div>
                        <ol class="text-muted small">
                            <li><strong>Choose Email Provider:</strong> SendGrid, Mailgun, or Amazon SES</li>
                            <li><strong>Backend Endpoint:</strong> <code>POST /api/emails/send-invoice</code></li>
                            <li><strong>Configure Authentication:</strong> JWT token validation</li>
                            <li><strong>Test & Deploy:</strong> Frontend will automatically use real emails</li>
                        </ol>
                        <div class="alert alert-success">
                            <small><i class="bi bi-check-circle"></i> <strong>Frontend Ready:</strong> No frontend changes needed - just implement the backend!</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="window.location.href='../pages/orders.html'">
                            View All Orders
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Cleanup when modal is hidden
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    /**
     * Share invoice via Web Share API or fallback
     * @param {Object} invoiceData - Invoice data
     */
    static async shareInvoice(invoiceData) {
        const shareData = {
            title: `Booklify Invoice - Order #${invoiceData.order.id}`,
            text: `Invoice for ${invoiceData.totals.currency}${invoiceData.totals.totalAmount.toFixed(2)} from Booklify`,
            url: window.location.href + `?invoice=${invoiceData.order.id}`
        };
        
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                console.log('Invoice shared successfully');
            } catch (error) {
                console.log('Share cancelled or failed:', error);
                this.copyInvoiceLink(invoiceData.order.id);
            }
        } else {
            // Fallback: copy to clipboard
            this.copyInvoiceLink(invoiceData.order.id);
        }
    }

    /**
     * Copy invoice link to clipboard
     * @param {number} orderId - Order ID
     */
    static copyInvoiceLink(orderId) {
        const link = `${window.location.origin}/pages/orders.html?invoice=${orderId}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(link).then(() => {
                this.createNotification('success', '📋 Link Copied!', `Invoice link copied to clipboard`, 5000);
            }).catch(() => {
                this.showLinkInTextarea(link);
            });
        } else {
            this.showLinkInTextarea(link);
        }
    }

    /**
     * Show link in a textarea for manual copying
     * @param {string} link - Link to show
     */
    static showLinkInTextarea(link) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">📋 Copy Invoice Link</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Copy this link to share your invoice:</p>
                        <textarea class="form-control" rows="3" readonly>${link}</textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Auto-select the text
        setTimeout(() => {
            const textarea = modal.querySelector('textarea');
            textarea.select();
        }, 500);
        
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    /**
     * Open invoice in new window
     * @param {string} invoiceHTML - Invoice HTML content
     * @param {Object} invoiceData - Invoice data object
     */
    static openInvoiceInNewWindow(invoiceHTML, invoiceData) {
        try {
            const invoiceWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
            invoiceWindow.document.write(invoiceHTML);
            invoiceWindow.document.close();
            
            // Add download button
            setTimeout(() => {
                if (window.InvoiceService && window.InvoiceService.addInvoiceActions) {
                    window.InvoiceService.addInvoiceActions(invoiceWindow, invoiceData);
                }
            }, 1000);
            
            console.log('Invoice opened in new window as fallback');
        } catch (error) {
            console.error('Could not open invoice window:', error);
        }
    }
    
    /**
     * Show success notification when email is sent
     * @param {string} email - Customer email
     * @param {number} orderId - Order ID
     * @param {string} messageId - Email service message ID (optional)
     */
    static showEmailSuccessNotification(email, orderId, messageId = null) {
        let message = `Your invoice for Order #${orderId} has been sent to ${email}`;
        if (messageId) {
            message += ` (Message ID: ${messageId.substring(0, 8)}...)`;
        }
        this.createNotification('success', '📧 Invoice Email Delivered!', message, 10000);
    }

    /**
     * Show fallback notification when email cannot be sent
     * @param {string} email - Customer email
     * @param {Object} invoiceData - Invoice data
     */
    static showEmailFallbackNotification(email, invoiceData) {
        const message = `Invoice for Order #${invoiceData.order.id} is ready for download. Email service temporarily unavailable.`;
        this.createNotification('warning', '📧 Invoice Ready', message, 10000, [
            {
                text: 'Download Invoice',
                action: () => this.downloadInvoiceFromStorage(invoiceData.order.id)
            },
            {
                text: 'View Orders',
                action: () => window.location.href = '../pages/orders.html'
            }
        ]);
    }

    /**
     * Show error notification when email fails
     * @param {string} email - Customer email
     */
    static showEmailErrorNotification(email) {
        this.createNotification('danger', '❌ Email Failed', `Could not send invoice to ${email}. Please download from orders page.`, 10000);
    }

    /**
     * Create a notification with optional action buttons
     * @param {string} type - Bootstrap alert type (success, warning, danger, info)
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {number} duration - Auto-hide duration in ms
     * @param {Array} actions - Optional action buttons
     */
    static createNotification(type, title, message, duration = 8000, actions = []) {
        // Create or find notification container
        let notificationContainer = document.getElementById('emailNotificationContainer');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'emailNotificationContainer';
            notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 450px;
            `;
            document.body.appendChild(notificationContainer);
        }
        
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show shadow-lg`;
        notification.style.cssText = 'border-left: 4px solid currentColor; margin-bottom: 10px;';
        
        let actionsHTML = '';
        if (actions.length > 0) {
            actionsHTML = `
                <div class="mt-2">
                    ${actions.map((action, index) => 
                        `<button type="button" class="btn btn-sm btn-outline-${type} me-2" data-action="${index}">${action.text}</button>`
                    ).join('')}
                </div>
            `;
        }
        
        notification.innerHTML = `
            <div>
                <div class="d-flex align-items-start">
                    <div class="flex-grow-1">
                        <strong>${title}</strong><br>
                        <small>${message}</small>
                        ${actionsHTML}
                    </div>
                    <button type="button" class="btn-close ms-2" data-bs-dismiss="alert"></button>
                </div>
            </div>
        `;
        
        // Add action button handlers
        actions.forEach((action, index) => {
            const button = notification.querySelector(`[data-action="${index}"]`);
            if (button) {
                button.addEventListener('click', () => {
                    action.action();
                    notification.remove();
                });
            }
        });
        
        notificationContainer.appendChild(notification);
        
        // Auto-remove after specified duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }

    /**
     * Download invoice from localStorage
     * @param {number} orderId - Order ID
     */
    static downloadInvoiceFromStorage(orderId) {
        try {
            const savedInvoices = JSON.parse(localStorage.getItem('booklify_saved_invoices') || '[]');
            const invoice = savedInvoices.find(inv => inv.orderId === orderId);
            
            if (invoice && window.InvoiceService) {
                const invoiceHTML = window.InvoiceService.generateInvoiceHTML(invoice.invoiceData);
                this.openInvoiceInNewWindow(invoiceHTML, invoice.invoiceData);
            } else {
                console.error('Invoice not found in storage:', orderId);
            }
        } catch (error) {
            console.error('Error downloading invoice from storage:', error);
        }
    }
    
    /**
     * Send invoice automatically after successful order/payment
     * @param {number} orderId - Order ID
     * @param {Object} userData - User data object
     * @returns {Promise<boolean>} Success status
     */
    static async sendInvoiceAfterPayment(orderId, userData) {
        try {
            console.log('Auto-sending invoice for order:', orderId);
            console.log('User data:', userData);
            
            // Check if we have necessary data
            if (!userData || !userData.email) {
                console.error('Missing user email for invoice sending');
                this.createNotification('warning', '⚠️ Email Required', 'Cannot send invoice: email address not found', 8000);
                return false;
            }
            
            // Check if InvoiceService is available
            if (!window.InvoiceService) {
                console.error('InvoiceService not available');
                return false;
            }
            
            // Quick backend availability check
            const backendAvailable = await this.checkBackendEmailService();
            if (backendAvailable) {
                console.log('✅ Email backend detected - will attempt real email sending');
            } else {
                console.log('⚠️ Email backend not available - will use fallback delivery');
            }
            
            // Generate invoice data using InvoiceService
            const invoiceData = await window.InvoiceService.generateInvoiceDataOnly(orderId, userData);
            const invoiceHTML = window.InvoiceService.generateInvoiceHTML(invoiceData);
            
            console.log('Generated invoice data:', invoiceData);
            
            // Send email (will try backend first, fallback to client-side)
            const result = await this.sendInvoiceByEmail(userData.email, userData.fullName || userData.name, invoiceData, invoiceHTML);
            
            console.log('Email sending result:', result);
            
            return result && result.success;
            
        } catch (error) {
            console.error('Auto-invoice sending failed:', error);
            this.createNotification('danger', '❌ Invoice Error', `Failed to process invoice for order #${orderId}`, 8000);
            return false;
        }
    }

    /**
     * Check if backend email service is available
     * @returns {Promise<boolean>} Backend availability
     */
    static async checkBackendEmailService() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
            
            const response = await fetch('http://localhost:8081/api/emails/send-invoice', {
                method: 'HEAD', // Just check if endpoint exists
                signal: controller.signal,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('booklifyToken')}`
                }
            });
            
            clearTimeout(timeoutId);
            
            // Even if unauthorized, it means the endpoint exists
            return response.status !== 404;
            
        } catch (error) {
            // Network error, timeout, or 404 - backend not available
            return false;
        }
    }

    /**
     * Check if invoice should be sent for order status
     * @param {string} orderStatus - Order status
     * @returns {boolean} Whether to send invoice
     */
    static shouldSendInvoice(orderStatus) {
        const invoiceStatuses = ['COMPLETED', 'DELIVERED', 'SHIPPED'];
        return invoiceStatuses.includes(orderStatus?.toUpperCase());
    }

    /**
     * Send invoice when order status changes to completed/delivered
     * @param {number} orderId - Order ID
     * @param {string} newStatus - New order status
     * @param {Object} userData - User data object
     * @returns {Promise<boolean>} Success status
     */
    static async sendInvoiceOnStatusChange(orderId, newStatus, userData) {
        try {
            if (!this.shouldSendInvoice(newStatus)) {
                console.log('Order status does not require invoice:', newStatus);
                return false;
            }

            console.log('Order status changed to:', newStatus, 'sending invoice for order:', orderId);
            
            // Check if invoice was already sent for this order
            const sentInvoices = JSON.parse(localStorage.getItem('booklify_sent_invoices') || '[]');
            if (sentInvoices.includes(orderId.toString())) {
                console.log('Invoice already sent for order:', orderId);
                return false;
            }

            // Send invoice
            const success = await this.sendInvoiceAfterPayment(orderId, userData);
            
            if (success) {
                // Mark invoice as sent
                sentInvoices.push(orderId.toString());
                localStorage.setItem('booklify_sent_invoices', JSON.stringify(sentInvoices));
            }

            return success;
            
        } catch (error) {
            console.error('Error sending invoice on status change:', error);
            return false;
        }
    }
}

// Export for use in other modules
export default EmailService;