/* eslint-disable import/no-internal-modules */
import { shareService } from './livecodes/services/share';
import { livecodes } from './livecodes/main';
import { customEvents } from './livecodes/custom-events';
import type { EmbedOptions } from './livecodes/models';

const loadPreview = async (id: string) => {
  if (!id) return;
  const content = await shareService.getProject(id);
  if (!content.result) return;

  const previewFrame = document.createElement('iframe');
  previewFrame.setAttribute(
    'sandbox',
    'allow-same-origin allow-downloads allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-presentation allow-scripts',
  );
  previewFrame.setAttribute('scrolling', 'no');
  previewFrame.classList.add('preview');
  previewFrame.srcdoc = content.result;
  document.body.appendChild(previewFrame);
};

const params = new URLSearchParams(location.search);
const isLite = params.get('lite') != null && params.get('lite') !== 'false';
const isEmbed = isLite || (params.get('embed') != null && params.get('embed') !== 'false');
const loadingParam = params.get('loading');
const clickToLoad = isEmbed && loadingParam !== 'eager';
const loading: EmbedOptions['loading'] = !isEmbed
  ? 'eager'
  : loadingParam === 'lazy' || loadingParam === 'click' || loadingParam === 'eager'
  ? loadingParam
  : 'lazy';

if (loadingParam === 'click' && params.get('preview') !== 'false') {
  const id = params.get('x');
  if (id?.startsWith('id/')) {
    loadPreview(id.replace('id/', ''));
  }
}

const animatingLogo = document.querySelector<HTMLElement>('#animating-logo')!;
const cube = document.querySelector<HTMLElement>('#cube')!;
const clickToLoadEl = document.querySelector<HTMLElement>('#click-to-load')!;

if (isEmbed) {
  document.body.classList.add('embed');
  if (clickToLoad) {
    document.body.classList.add('click-to-load');
    cube.classList.remove('cube');
    animatingLogo.classList.add('hidden');
    animatingLogo.style.display = 'none';
    clickToLoadEl.style.display = 'flex';
    clickToLoadEl.classList.add('visible');

    // load on click
    clickToLoadEl.addEventListener('click', load);

    // load from API
    addEventListener('message', (e) => {
      if (e.source === parent && e.data?.type === customEvents.load) {
        load();
      }
    });

    // load on visible
    if (loading === 'lazy' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach(async (entry) => {
            if (entry.isIntersecting) {
              load();
              observer.unobserve(document.body);
            }
          });
        },
        { rootMargin: '150px' },
      );
      observer.observe(document.body);
    }
  }
}

let loadTriggered = false;
function load() {
  if (loadTriggered) return;
  clickToLoadEl.classList.remove('visible');
  document.querySelector('.preview')?.classList.add('hidden');
  setTimeout(() => {
    document.body.classList.remove('click-to-load');
    animatingLogo.style.display = 'flex';
    animatingLogo.classList.remove('hidden');
    cube.classList.add('cube');
    setTimeout(() => {
      clickToLoadEl.remove();
      document.querySelector('.preview')?.remove();
    }, 300);
  }, 500);
  window.dispatchEvent(new Event(customEvents.load));
  loadTriggered = true;
}

function resize() {
  document.body.style.height = window.innerHeight + 'px';
}

resize();
window.addEventListener('resize', resize, false);
setTimeout(resize, 500);

window.addEventListener(customEvents.appLoaded, (e: CustomEventInit) => {
  animatingLogo.remove();
  (window as any).api = e.detail;
});

window.addEventListener(customEvents.ready, () => {
  // project loaded
});

window.addEventListener(customEvents.change, () => {
  // content change
});

window.addEventListener(customEvents.testResults, (_e: CustomEventInit) => {
  // const testResults = e.detail;
});

window.addEventListener(customEvents.destroy, () => {
  window.removeEventListener('resize', resize);
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

livecodes('#livecodes', {});
