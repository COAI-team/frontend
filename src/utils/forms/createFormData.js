export function createFormData(form, pw, file) {
    const formData = new FormData();
    formData.append("userName", form.name.value);
    formData.append("userNickname", form.nickname.value);
    formData.append("userEmail", form.email.value);
    formData.append("userPw", pw);
    if (file) formData.append("image", file);
    return formData;
}
