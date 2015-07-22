SC_W = 512;
SC_H = 512;

app = {};
tm.main(function() {
    app = Util("#world");
    app.run();
});

Util = tm.createClass({
    superClass: tm.app.CanvasApp,

    init: function(id) {
        this.superInit(id);
        this.resize(SC_W, SC_H).fitWindow();

        //アセット読み込みシーン
        var loadingScene = LoadingScene({
            assets: {
                tex: "gradriel_tex.png",
                aplane: "gradriel_alpha.png"
            },
            width: SC_W,
            height: SC_H,
            bgColor: 'rgba(0, 0, 0, 1)',
            nextScene: function() {
                this._onLoadAssets();
                return MainScene();
            }.bind(this)
        });

        this.replaceScene(loadingScene);
    },

    _onLoadAssets: function() {
        var tex = tm.asset.AssetManager.get("tex");
        var aplane = tm.asset.AssetManager.get("aplane");

        var canvas1 = tm.graphics.Canvas();
        canvas1.resize(tex.width, tex.height);
        canvas1.drawTexture(tex, 0, 0);

        var canvas2 = tm.graphics.Canvas();
        canvas2.resize(aplane.width, aplane.height);
        canvas2.drawTexture(aplane, 0, 0);

        var bm1 = canvas1.getBitmap();
        var bm2 = canvas2.getBitmap();
        var len = bm1.width*bm1.height;
        for (var i = 0; i < len; i++) {
            var p1 = bm1.getPixelIndex(i);
            var p2 = bm2.getPixelIndex(i);
            if (p2[0] == 0) {
                p1[0] = 0;
                p1[1] = 0;
                p1[2] = 0;
                p1[3] = 0;
            }
            bm1.setPixel32Index(i, p1[0], p1[1], p1[2], p1[3]);
        }

        var cv = tm.graphics.Canvas();
        cv.resize(tex.width, tex.height);
        cv.drawBitmap(bm1, 0, 0);
        tm.asset.AssetManager.set("texEx", cv);
    },

});

tm.define("MainScene", {
    superClass: "tm.app.Scene",

    init: function(param) {
        this.superInit();

        tm.display.Sprite("texEx")
            .addChildTo(this)
            .setOrigin(0, 0);
    },
});
