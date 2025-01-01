// TODO make a call to the backend to set the color that the streamer wants for the defaults
window.Twitch.ext.onAuthorized(function (auth) {
    console.log("auth" + auth.channelId);
    // TODO make a call to the backend to check to see if there is a color for this channel ID

    // TODO if there is no color, create a new account for this id
});

// TODO get the current color selected

const selectedColorText = document.getElementById("selected-color");
// Update the displayed color value when the user selects a color

  const colorInput = document.getElementById("window-color");
  colorInput.addEventListener("input", () => {
    const color = colorInput.value;
    selectedColorText.textContent = color;

    // Store the color in localStorage (optional)
    localStorage.setItem("windowColor", color);

    // You can send this color to the Twitch Extension configuration service or use it as needed
    console.log("Selected Color:", color);
  });

  // Load previously selected color from localStorage (if available)
  const savedColor = localStorage.getItem("windowColor");
  if (savedColor) {
    colorInput.value = savedColor;
    selectedColorText.textContent = savedColor;
  }
});