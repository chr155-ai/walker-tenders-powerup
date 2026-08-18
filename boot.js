/* global TrelloPowerUp */
var HOST = "https://chr155-ai.github.io/walker-tenders-powerup";
TrelloPowerUp.initialize({
  "board-buttons": function (t) {
    return [
      {
        text: "Pricing",
        icon: {
          dark: HOST + "/icon-dark.png",
          light: HOST + "/icon-light.png",
        },
        callback: function (t) {
          return t.modal({
            url: HOST + "/year.html",
            fullscreen: true,
            title: "Walker Pricing",
          });
        },
      },
    ];
  },
});
