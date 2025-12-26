import {useEffect} from 'react';

export function createScrollObserver() {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -50px 0px" }
  );
}

export function observeElements(observer, selector = ".reveal-on-scroll") {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => observer.observe(el));
  return () => observer.disconnect();
}

export const useScrollReveal = () => {
  useEffect(() => {
    const observer = createScrollObserver();
    return observeElements(observer);
  }, []);
};
