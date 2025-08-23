export function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.classList.add("notification", `notification-${type}`);

    const icon = document.createElement("span");
    icon.classList.add("material-icons");
    icon.textContent = {
        success: "check_circle",
        error: "error",
        warning: "warning"
    }[type];

    const text = document.createElement("span");
    text.textContent = message;

    notification.appendChild(icon);
    notification.appendChild(text);

    const container = document.querySelector("#notifications-container");
    container.appendChild(notification);

    setTimeout(() => notification.classList.add("show"), 10);

    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}