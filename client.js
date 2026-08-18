/* global TrelloPowerUp */
TrelloPowerUp.initialize({
  "board-buttons": function (t) {
    return [
      {
        text: "Pricing",
        icon: {
          dark: "./icon-dark.png",
          light: "./icon-light.png",
        },
        callback: function (t) {
          return t.modal({
            url: "./dashboard.html",
            fullscreen: true,
            title: "Walker Pricing",
          });
        },
      },
    ];
  },
});
