function isValidVersion(required, current) {
  const requiredArray = required.split('.');
  const currentArray = current.split('.');

  for (let i = 0; i < requiredArray.length; i++) {
    if (!currentArray[i] || currentArray[i] < requiredArray[i]) {
      return false;
    }
  }

  return true;
}
function domReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

class Bridge {
  init() {
    this.setAlpine(window.Alpine); // eslint-disable-line no-undef

    this.tagCloakedElements(document.body);
    this.configureEventHandlers();
  }

  setAlpine(reference) {
    if (!reference.version || !isValidVersion('2.4.0', reference.version)) {
      throw new Error('Invalid Alpine version. Please use Alpine 2.4.0 or above');
    }

    this.alpine = reference;
  } // Tag cloaked elements so we can cloak them again before caching


  tagCloakedElements(node) {
    node.querySelectorAll('[x-cloak]').forEach(el => {
      el.setAttribute('data-alpine-was-cloaked', '');
    });
  }

  removeAlpineGeneratedElements(node) {
    node.querySelectorAll('[data-alpine-generated-me]').forEach(el => {
      el.removeAttribute('data-alpine-generated-me');

      if (typeof el.__x_for_key === 'undefined' && typeof el.__x_inserted_me === 'undefined') {
        el.remove();
      }
    });
  }

  tagAlpineGeneratedElements(node) {
    node.querySelectorAll('[x-for],[x-if]').forEach(el => {
      if (el.hasAttribute('x-for')) {
        let nextEl = el.nextElementSibling;

        while (nextEl && nextEl.__x_for_key !== 'undefined') {
          const currEl = nextEl;
          nextEl = nextEl.nextElementSibling;
          currEl.setAttribute('data-alpine-generated-me', true);
        }
      } else if (el.hasAttribute('x-if')) {
        const ifEl = el.nextElementSibling;

        if (ifEl && typeof ifEl.__x_inserted_me !== 'undefined') {
          ifEl.setAttribute('data-alpine-generated-me', true);
        }
      }
    });
  }

  restoreCloakAttributes() {
    document.body.querySelectorAll('[data-alpine-was-cloaked]').forEach(el => {
      el.setAttribute('x-cloak', '');
      el.removeAttribute('data-alpine-was-cloaked');
    });
  }

  configureEventHandlers() {
    document.addEventListener('turbolinks:load', () => {
      // Once Turbolinks finished is magic, we initialise Alpine on the new page
      // and resume the observer
      this.alpine.discoverUninitializedComponents(el => {
        this.alpine.initializeComponent(el);
      });
      this.alpine.pauseMutationObserver = true;
    }); // Before swapping the body, clean up any element with x-turbolinks-cached
    // which do not have any Alpine properties.
    // Note, at this point all html fragments marked as data-turbolinks-permanent
    // are already copied over from the previous page so they retain their listener
    // and custom properties and we don't want to reset them.

    document.addEventListener('turbolinks:before-render', event => {
      this.removeAlpineGeneratedElements(event.data.newBody); // When we get a new document body tag any cloaked elements so we can cloak
      // them again before caching.

      this.tagCloakedElements(event.data.newBody);
    }); // Pause the the mutation observer to avoid data races, it will be resumed by the turbolinks:load event.
    // We mark as `data-alpine-generated-m` all elements that are crated by an Alpine templating directives.
    // The reason is that turbolinks caches pages using cloneNode which removes listeners and custom properties
    // So we need to propagate this infomation using a HTML attribute. I know, not ideal but I could not think
    // of a better option.
    // Note, we can't remove any Alpine generated element as yet because if they live inside an element
    // marked as data-turbolinks-permanent they need to be copied into the next page.
    // The copying process happens somewhere between before-cache and before-render.

    document.addEventListener('turbolinks:before-cache', () => {
      this.alpine.pauseMutationObserver = true;
      this.tagAlpineGeneratedElements(document.body); // Cloak any elements again that were tagged when the page was loaded

      this.restoreCloakAttributes();
    });
  }

}

const initAlpine = window.deferLoadingAlpine || (callback => callback());

window.deferLoadingAlpine = callback => {
  domReady(() => {
    const bridge = new Bridge();
    bridge.init();
    initAlpine(callback);
  });
};
