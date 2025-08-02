/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// HTMLFormElement.requestSubmit polyfill for jsdom
if (!HTMLFormElement.prototype.requestSubmit) {
  HTMLFormElement.prototype.requestSubmit = function(submitter?: HTMLElement) {
    if (submitter) {
      const form = (submitter as any).form
      if (form && form !== this) {
        throw new Error('Failed to execute \'requestSubmit\' on \'HTMLFormElement\': The specified element is not owned by this form element.')
      }
    }
    
    const event = new Event('submit', { bubbles: true, cancelable: true })
    
    // Add submitter property to the event
    Object.defineProperty(event, 'submitter', {
      value: submitter || null,
      writable: false,
      enumerable: true,
      configurable: true
    })
    
    this.dispatchEvent(event)
  }
}

// Also define directly on HTMLFormElement to override JSDOM's implementation
if (typeof HTMLFormElement !== 'undefined') {
  // const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit
  HTMLFormElement.prototype.requestSubmit = function(submitter?: HTMLElement) {
    if (submitter) {
      const form = (submitter as any).form
      if (form && form !== this) {
        throw new Error('Failed to execute \'requestSubmit\' on \'HTMLFormElement\': The specified element is not owned by this form element.')
      }
    }
    
    const event = new Event('submit', { bubbles: true, cancelable: true })
    
    // Add submitter property to the event
    Object.defineProperty(event, 'submitter', {
      value: submitter || null,
      writable: false,
      enumerable: true,
      configurable: true
    })
    
    this.dispatchEvent(event)
  }
}