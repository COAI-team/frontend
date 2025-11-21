import axios from "axios";
import imageCompression from "browser-image-compression";

// 대표 이미지가 있는지 확인하는 헬퍼 함수
const checkIfHasRepresentative = (editor) => {
  let hasRepresentative = false;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "blockImage" && node.attrs.isRepresentative) {
      hasRepresentative = true;
    }
  });
  return hasRepresentative;
};

// 이미지 업로드
export const addImage = async (editor) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.click();

  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;

    const originalFileName = file.name;

    try {
      // 로딩 스피너 먼저 삽입
      editor.chain().focus().insertImageLoading().run();

      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const fileToUpload = new File([compressed], originalFileName, {
        type: compressed.type || file.type,
        lastModified: Date.now(),
      });

      const formData = new FormData();
      formData.append("file", fileToUpload);

      const res = await axios.post(
        "http://localhost:8090/upload/image",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const url =
        typeof res.data === "string"
          ? res.data
          : res.data.url || res.data.path || res.data.src;

      if (!url) throw new Error("이미지 URL 없음");

      // 로딩 스피너 찾아서 이미지로 교체 (마지막 로딩 스피너)
      let loadingPos = null;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "imageLoading") {
          loadingPos = pos; // 마지막 것으로 계속 업데이트
        }
      });

      if (loadingPos !== null) {
        // 스피너 삭제하고 같은 위치에 이미지 삽입
        const hasRepresentative = checkIfHasRepresentative(editor);
        
        editor
          .chain()
          .focus()
          .deleteRange({ from: loadingPos, to: loadingPos + 1 })
          .setTextSelection(loadingPos)
          .setBlockImage({ 
            src: url,
            isRepresentative: !hasRepresentative // 대표가 없으면 자동으로 설정
          })
          .run();
        
        // 이미지 다음 위치로 커서 이동
        setTimeout(() => {
          const newPos = loadingPos + 1;
          editor
            .chain()
            .focus()
            .setTextSelection(newPos)
            .run();
        }, 0);
      } else {
        // 로딩 스피너를 못 찾으면 현재 위치에 삽입
        const hasRepresentative = checkIfHasRepresentative(editor);
        editor.chain().focus().setBlockImage({ 
          src: url,
          isRepresentative: !hasRepresentative
        }).run();
      }

    } catch (err) {
      // 에러 발생 시 로딩 스피너 삭제 (마지막 것)
      let loadingPos = null;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "imageLoading") {
          loadingPos = pos; // 마지막 것으로 계속 업데이트
        }
      });

      if (loadingPos !== null) {
        editor
          .chain()
          .focus()
          .deleteRange({ from: loadingPos, to: loadingPos + 1 })
          .run();
      }

      alert(`이미지 업로드 실패: ${err.message}`);
    }
  };
};

// 링크 삽입
export const addLink = (editor) => {
  if (!editor) return;

  const input = window.prompt("링크 주소를 입력하세요:");
  if (!input) return;

  let url = input.trim();

  // URL 형식 보정
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  const { empty } = editor.state.selection;

  if (empty) {
    // 선택된 텍스트가 없을 때: 링크가 적용된 텍스트 노드 직접 삽입
    editor
      .chain()
      .focus()
      .insertContent({
        type: "text",
        text: url,
        marks: [
          {
            type: "link",
            attrs: { href: url, target: "_blank" },
          },
        ],
      })
      .run();

    // 커서 뒤에 공백 추가하여 링크에서 벗어남
    editor.chain().focus().insertContent(" ").run();
    return;
  }

  // 텍스트 선택된 경우
  editor.chain().focus().setLink({ href: url }).run();
};

// 링크 제거
export const removeLink = (editor) => {
  if (!editor) return;
  editor.chain().focus().unsetLink().run();
};

// 링크 카드 삽입
export const addLinkCard = async (editor) => {
  if (!editor) return;

  const input = window.prompt("링크 주소를 입력하세요:");
  if (!input) return;

  let url = input.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  try {
    const res = await axios.post("http://localhost:8090/link/preview", {
      url,
    });

    const data = res.data;

    editor
      .chain()
      .focus()
      .insertContent({
        type: "linkPreview",
        attrs: {
          title: data.title,
          description: data.description,
          image: data.image,
          site: data.site,
          url: data.url,
        },
      })
      .run();
  } catch (e) {
    alert("링크 정보를 가져오지 못했습니다.");
  }
};