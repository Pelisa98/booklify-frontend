// sell.js - This should be placed in your ../js/ directory
document.addEventListener('DOMContentLoaded', function() {
    const sellForm = document.getElementById('sellForm');
    const submitButton = document.getElementById('submitButton');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');

    sellForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading state
        submitText.textContent = 'Processing...';
        submitSpinner.classList.remove('d-none');
        submitButton.disabled = true;

        try {
            // Validate form
            if (!validateForm()) {
                return;
            }

            // Prepare book data
                const book = {
                    title: document.getElementById('bookTitle').value.trim(),
                    author: document.getElementById('bookAuthor').value.trim(),
                    publisher: document.getElementById('bookPublisher').value.trim(),
                    isbn: document.getElementById('bookISBN').value.trim(),
                    condition: document.getElementById('bookCondition').value,
                    price: parseFloat(document.getElementById('bookPrice').value),
                    description: document.getElementById('bookDescription').value.trim(),
                    uploadedDate: new Date().toISOString(),
                    userId: Number(localStorage.getItem('booklifyUserId')) // Add userId here
                };
            // Get image file
            const imageFile = document.getElementById('bookImage').files[0];

            // Create FormData to send both JSON and file
            const formData = new FormData();
            formData.append('bookRequest', new Blob([JSON.stringify(book)], {
                type: 'application/json'
            }));
            
            if (imageFile) {
                // Validate image size (max 5MB)
                if (imageFile.size > 5 * 1024 * 1024) {
                    throw new Error('Image size exceeds 5MB limit');
                }
                formData.append('imageFile', imageFile);
            }

            // Send to backend
            const response = await fetch('http://localhost:8081/api/book/create', {
                method: 'POST',
                body: formData
                // Don't set Content-Type header - let browser set it with boundary
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to create book');
            }
            const result = await response.json();
            showSuccessMessage('Book successfully listed!');
            sellForm.reset();
            
        } catch (error) {
            console.error('Error:', error);
            showErrorMessage(error.message || 'Error submitting book');
        } finally {
            // Reset button state
            submitText.textContent = 'Submit Listing';
            submitSpinner.classList.add('d-none');
            submitButton.disabled = false;
        }
    });

    function validateForm() {
        const requiredFields = [
            'bookTitle', 'bookAuthor', 'bookCondition', 'bookPrice'
        ];
        
        let isValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });

        // Validate price is positive number
        const priceField = document.getElementById('bookPrice');
        if (priceField.value && parseFloat(priceField.value) <= 0) {
            priceField.classList.add('is-invalid');
            isValid = false;
        }

        return isValid;
    }

    function showSuccessMessage(message) {
        // Create or show a success alert
        let alertDiv = document.getElementById('formAlert');
        if (!alertDiv) {
            alertDiv = document.createElement('div');
            alertDiv.id = 'formAlert';
            alertDiv.className = 'alert alert-success mt-3';
        }
        alertDiv.textContent = message;
        alertDiv.classList.remove('d-none');
        
        // Hide after 5 seconds
        setTimeout(() => {
            alertDiv.classList.add('d-none');
        }, 5000);
    }

    function showErrorMessage(message) {
        // Create or show an error alert
        let alertDiv = document.getElementById('formAlert');
        if (!alertDiv) {
            alertDiv = document.createElement('div');
            alertDiv.id = 'formAlert';
            alertDiv.className = 'alert alert-danger mt-3';
            sellForm.parentNode.insertBefore(alertDiv, sellForm.nextSibling);
        }
        alertDiv.textContent = message;
        alertDiv.classList.remove('d-none');
        
        // Hide after 5 seconds
        setTimeout(() => {
            alertDiv.classList.add('d-none');
        }, 5000);
    }

    // Add real-time validation for required fields
    const requiredFields = ['bookTitle', 'bookAuthor', 'bookCondition', 'bookPrice'];
    requiredFields.forEach(fieldId => {
        document.getElementById(fieldId).addEventListener('input', function() {
            if (this.value.trim()) {
                this.classList.remove('is-invalid');
            }
        });
    });
});