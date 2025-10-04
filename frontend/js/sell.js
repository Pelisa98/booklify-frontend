// sell.js - This should be placed in your ../js/ directory
document.addEventListener('DOMContentLoaded', function() {
    const sellForm = document.getElementById('sellForm');
    const submitButton = document.getElementById('submitButton');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    const formAlertContainer = document.getElementById('formAlertContainer');

    // Initially disable the submit button
    submitButton.disabled = true;

    // Function to check if all required fields are valid
    function isFormValid() {
        const requiredFields = [
            {id: 'bookTitle', name: 'Book Title'},
            {id: 'bookAuthor', name: 'Author'},
            {id: 'bookCondition', name: 'Condition'},
            {id: 'bookPrice', name: 'Price'}
        ];
        
        let isValid = true;
        
        // Check required fields
        requiredFields.forEach(field => {
            const fieldElement = document.getElementById(field.id);
            if (!fieldElement.value.trim()) {
                isValid = false;
            }
        });

        // Validate price is positive number
        const priceField = document.getElementById('bookPrice');
        if (priceField.value && parseFloat(priceField.value) <= 0) {
            isValid = false;
        }

        // Validate image file type if provided
        const imageField = document.getElementById('bookImage');
        if (imageField.files.length > 0) {
            const file = imageField.files[0];
            const validTypes = ['image/jpeg', 'image/png'];
            
            if (!validTypes.includes(file.type)) {
                isValid = false;
            }
        }

        return isValid;
    }

    // Function to update submit button state
    function updateSubmitButton() {
        submitButton.disabled = !isFormValid();
    }

    // Add event listeners to all form fields
    const formFields = ['bookTitle', 'bookAuthor', 'bookCondition', 'bookPrice', 'bookImage'];
    formFields.forEach(fieldId => {
        document.getElementById(fieldId).addEventListener('input', function() {
            validateField(fieldId);
            updateSubmitButton();
        });
        
        document.getElementById(fieldId).addEventListener('change', function() {
            validateField(fieldId);
            updateSubmitButton();
        });
    });

    // Validate individual field
    function validateField(fieldId) {
        const fieldElement = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');
        
        switch(fieldId) {
            case 'bookTitle':
            case 'bookAuthor':
            case 'bookCondition':
                if (!fieldElement.value.trim()) {
                    fieldElement.classList.add('is-invalid');
                    if (errorElement) {
                        errorElement.textContent = `${getFieldName(fieldId)} is required`;
                    }
                } else {
                    fieldElement.classList.remove('is-invalid');
                    if (errorElement) {
                        errorElement.textContent = '';
                    }
                }
                break;
                
            case 'bookPrice':
                if (!fieldElement.value.trim()) {
                    fieldElement.classList.add('is-invalid');
                    if (errorElement) {
                        errorElement.textContent = 'Price is required';
                    }
                } else if (parseFloat(fieldElement.value) <= 0) {
                    fieldElement.classList.add('is-invalid');
                    if (errorElement) {
                        errorElement.textContent = 'Price must be greater than 0';
                    }
                } else {
                    fieldElement.classList.remove('is-invalid');
                    if (errorElement) {
                        errorElement.textContent = '';
                    }
                }
                break;
                
            case 'bookImage':
                if (fieldElement.files.length > 0) {
                    const file = fieldElement.files[0];
                    const validTypes = ['image/jpeg', 'image/png'];
                    
                    if (!validTypes.includes(file.type)) {
                        fieldElement.classList.add('is-invalid');
                        if (errorElement) {
                            errorElement.textContent = 'Only JPEG and PNG images are allowed';
                        }
                    } else {
                        fieldElement.classList.remove('is-invalid');
                        if (errorElement) {
                            errorElement.textContent = '';
                        }
                    }
                } else {
                    fieldElement.classList.remove('is-invalid');
                    if (errorElement) {
                        errorElement.textContent = '';
                    }
                }
                break;
        }
    }

    // Helper function to get field name
    function getFieldName(fieldId) {
        const fieldNames = {
            'bookTitle': 'Book Title',
            'bookAuthor': 'Author',
            'bookCondition': 'Condition',
            'bookPrice': 'Price'
        };
        return fieldNames[fieldId] || fieldId;
    }

    sellForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Final validation before submission
        if (!validateForm()) {
            return;
        }

        // Show loading state
        submitText.textContent = 'Processing...';
        submitSpinner.classList.remove('d-none');
        submitButton.disabled = true;

        try {
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
                userId: Number(localStorage.getItem('booklifyUserId'))
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
            updateSubmitButton();
        }
    });

    function validateForm() {
        const requiredFields = [
            {id: 'bookTitle', name: 'Book Title'},
            {id: 'bookAuthor', name: 'Author'},
            {id: 'bookCondition', name: 'Condition'},
            {id: 'bookPrice', name: 'Price'}
        ];
        
        let isValid = true;
        
        // Clear previous error messages
        clearErrorMessages();
        
        requiredFields.forEach(field => {
            const fieldElement = document.getElementById(field.id);
            const errorElement = document.getElementById(field.id + 'Error');
            
            if (!fieldElement.value.trim()) {
                fieldElement.classList.add('is-invalid');
                if (errorElement) {
                    errorElement.textContent = `${field.name} is required`;
                }
                isValid = false;
            } else {
                fieldElement.classList.remove('is-invalid');
                if (errorElement) {
                    errorElement.textContent = '';
                }
            }
        });

        // Validate price is positive number
        const priceField = document.getElementById('bookPrice');
        const priceError = document.getElementById('bookPriceError');
        if (priceField.value && parseFloat(priceField.value) <= 0) {
            priceField.classList.add('is-invalid');
            if (priceError) {
                priceError.textContent = 'Price must be greater than 0';
            }
            isValid = false;
        }

        // Validate image file type if provided
        const imageField = document.getElementById('bookImage');
        const imageError = document.getElementById('bookImageError');
        if (imageField.files.length > 0) {
            const file = imageField.files[0];
            const validTypes = ['image/jpeg', 'image/png'];
            
            if (!validTypes.includes(file.type)) {
                imageField.classList.add('is-invalid');
                if (imageError) {
                    imageError.textContent = 'Only JPEG and PNG images are allowed';
                }
                isValid = false;
            }
        }

        return isValid;
    }

    function clearErrorMessages() {
        const errorElements = document.querySelectorAll('.form-error');
        errorElements.forEach(element => {
            element.textContent = '';
        });
        
        const invalidFields = document.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => {
            field.classList.remove('is-invalid');
        });
    }

    function showSuccessMessage(message) {
        // Create success alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'lilac-alert success';
        alertDiv.innerHTML = `
            <span>${message}</span>
            <button type="button" class="alert-close">&times;</button>
        `;
        
        // Insert before the submit button
        if (formAlertContainer) {
            formAlertContainer.innerHTML = '';
            formAlertContainer.appendChild(alertDiv);
            
            // Add event listener to close button
            alertDiv.querySelector('.alert-close').addEventListener('click', function() {
                alertDiv.remove();
            });
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        } else {
            // Fallback to toast if container doesn't exist
            const toastEl = document.getElementById('bookToast');
            const toastMessage = document.getElementById('bookToastMessage');
            if (toastEl && toastMessage) {
                toastMessage.textContent = message;
                toastEl.classList.remove('bg-danger');
                toastEl.classList.add('bg-success');
                const toast = new bootstrap.Toast(toastEl);
                toast.show();
            }
        }
    }

    function showErrorMessage(message) {
        // Create error alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'lilac-alert error';
        alertDiv.innerHTML = `
            <span>${message}</span>
            <button type="button" class="alert-close">&times;</button>
        `;
        
        // Insert before the submit button
        if (formAlertContainer) {
            formAlertContainer.innerHTML = '';
            formAlertContainer.appendChild(alertDiv);
            
            // Add event listener to close button
            alertDiv.querySelector('.alert-close').addEventListener('click', function() {
                alertDiv.remove();
            });
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        } else {
            // Fallback to toast if container doesn't exist
            const toastEl = document.getElementById('bookToast');
            const toastMessage = document.getElementById('bookToastMessage');
            if (toastEl && toastMessage) {
                toastMessage.textContent = message;
                toastEl.classList.remove('bg-success');
                toastEl.classList.add('bg-danger');
                const toast = new bootstrap.Toast(toastEl);
                toast.show();
            }
        }
    }
});