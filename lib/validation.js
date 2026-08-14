export function highlightAndFocusMissingFields(containerSelector = 'body') {
  const container = document.querySelector(containerSelector);
  if (!container) return false;
  
  const requiredFields = container.querySelectorAll('input[required], select[required], textarea[required]');
  let firstMissing = null;
  let hasMissing = false;
  
  requiredFields.forEach(field => {
    // Check if the field is empty (or only contains whitespace)
    if (!field.value || field.value.trim() === '') {
      hasMissing = true;
      field.classList.add('field-error-highlight');
      
      // Automatically remove the highlight when the user types or selects a value
      const removeError = () => {
        field.classList.remove('field-error-highlight');
        field.removeEventListener('input', removeError);
        field.removeEventListener('change', removeError);
      };
      
      field.addEventListener('input', removeError);
      field.addEventListener('change', removeError);
      
      if (!firstMissing) firstMissing = field;
    } else {
      field.classList.remove('field-error-highlight');
    }
  });

  if (firstMissing) {
    firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      // Small delay to let scroll happen before focus
      if (typeof firstMissing.focus === 'function') {
        firstMissing.focus({ preventScroll: true });
      }
    }, 150);
  }
  
  return hasMissing;
}
