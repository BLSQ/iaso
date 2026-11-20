let djangoPasswordEyeElements = [];

function togglePasswordEyeInput(input, iElement) {
    if (input == null) {
        return null;
    } else if (input.type === "text") {
        input.type = "password";
        iElement.classList.add("fa-eye-slash");
        iElement.classList.remove("fa-eye");
    } else if (input.type === "password") {
        input.type = "text";
        iElement.classList.remove("fa-eye-slash");
        iElement.classList.add("fa-eye");
    }
}

function djangoPasswordEyeClickHandler(event) {
    event.preventDefault();
    for (let i = 0; i < djangoPasswordEyeElements.length; i++) {
        const element = djangoPasswordEyeElements[i];
        const iElement = element.querySelector("i");
        const input = element.querySelector("input");
        togglePasswordEyeInput(input, iElement);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    djangoPasswordEyeElements = document.getElementsByClassName("django_password_eye");
    for (let i = 0; i < djangoPasswordEyeElements.length; i++) {
        djangoPasswordEyeElements[i]
            .querySelector(".input-group-addon")
            .addEventListener("click", djangoPasswordEyeClickHandler);
    }
});
