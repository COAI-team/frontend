import React, { useRef, useEffect } from 'react';
import { processCodeBlocks, applyHighlighting } from '../../utils/codeBlockUtils';

const FreeboardContent = React.memo(({ content, isDark, boardId }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current) return;

    const stickerImages = contentRef.current.querySelectorAll(
      'img[data-sticker], img[src*="openmoji"]'
    );
    stickerImages.forEach((img) => {
      img.style.width = "1.5em";
      img.style.height = "1.5em";
      img.style.verticalAlign = "-0.3em";
      img.style.display = "inline-block";
      img.style.margin = "0 0.1em";
    });

    processCodeBlocks(contentRef.current, isDark);

    const linkPreviews = contentRef.current.querySelectorAll(
      'div[data-type="link-preview"]'
    );

    linkPreviews.forEach((preview) => {
      const title = preview.getAttribute("data-title");
      const description = preview.getAttribute("data-description");
      const image = preview.getAttribute("data-image");
      const site = preview.getAttribute("data-site");
      const url = preview.getAttribute("data-url");

      if (url) {
        preview.innerHTML = "";
        preview.className = `link-preview-card ${isDark ? "dark" : "light"}`;
        preview.style.cssText = `
          border: 1px solid ${isDark ? "#2b2b2b" : "#e5e7eb"};
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1rem 0;
          display: flex;
          gap: 1rem;
          background: ${isDark ? "#1f1f1f" : "#ffffff"};
          cursor: pointer;
          transition: all 0.2s;
        `;

        preview.addEventListener("mouseenter", () => {
          preview.style.borderColor = isDark ? "#60a5fa" : "#3b82f6";
        });

        preview.addEventListener("mouseleave", () => {
          preview.style.borderColor = isDark ? "#2b2b2b" : "#e5e7eb";
        });

        preview.addEventListener("click", () => {
          window.open(url, "_blank");
        });

        if (image) {
          const imgContainer = document.createElement("div");
          imgContainer.style.cssText =
            "flex-shrink: 0; width: 120px; height: 120px; overflow: hidden; border-radius: 0.375rem;";

          const img = document.createElement("img");
          img.src = image;
          img.alt = title || "Link preview";
          img.style.cssText =
            "width: 100%; height: 100%; object-fit: cover;";

          imgContainer.appendChild(img);
          preview.appendChild(imgContainer);
        }

        const textContainer = document.createElement("div");
        textContainer.style.cssText = "flex: 1; min-width: 0;";

        if (site) {
          const siteSpan = document.createElement("div");
          siteSpan.textContent = site;
          siteSpan.style.cssText = `
            font-size: 0.875rem;
            color: ${isDark ? "#9ca3af" : "#6b7280"};
            margin-bottom: 0.25rem;
          `;
          textContainer.appendChild(siteSpan);
        }

        if (title) {
          const titleDiv = document.createElement("div");
          titleDiv.textContent = title;
          titleDiv.style.cssText = `
            font-weight: 600;
            font-size: 1rem;
            color: ${isDark ? "#f3f4f6" : "#111827"};
            margin-bottom: 0.25rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          `;
          textContainer.appendChild(titleDiv);
        }

        if (description) {
          const descDiv = document.createElement("div");
          descDiv.textContent = description;
          descDiv.style.cssText = `
            font-size: 0.875rem;
            color: ${isDark ? "#d1d5db" : "#4b5563"};
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          `;
          textContainer.appendChild(descDiv);
        }

        preview.appendChild(textContainer);
      }
    });

    applyHighlighting(contentRef.current);
  }, [content, isDark, boardId]);

  return (
    <div
      ref={contentRef}
      className={`freeboard-content ${isDark ? 'dark' : 'light'}`}
      style={{ marginBottom: "2rem" }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
});

FreeboardContent.displayName = 'FreeboardContent';

export default FreeboardContent;