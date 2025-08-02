// HTMLFormElement.requestSubmit polyfill for jsdom
Object.defineProperty(HTMLFormElement.prototype, 'requestSubmit', {
  value: function(submitter?: HTMLElement) {
    const event = new Event('submit', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'submitter', { 
      value: submitter || null,
      writable: false,
      enumerable: true
    })
    this.dispatchEvent(event)
  },
  writable: true,
  configurable: true
})