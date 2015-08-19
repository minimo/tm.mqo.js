tm.main(function() {
    var app = tm.hybrid.Application("#canvas2d", "#canvas3d");
    app.resize(640, 960).fitWindow().run();
    
    app.replaceScene(tm.game.LoadingScene({
        width: 640, height: 960,
        assets: {
            // 拡張子による判別がきかないため、typeパラメータをつける
            kirara: {
                type: "three",
                url: "assets/kirara.json",
            },

            hiyoko:     "assets/hiyoco_nomal_full.png",

            gradriel:   "assets/gradriel_pose.mqo",
            fossil:     "assets/iron_fossil.mqo",
            r9:         "assets/R-9C.mqo",
            silverhawk: "assets/silverhawk.mqo",
        },
        nextScene: KiraraOnStage,
    }));
});

tm.define("KiraraOnStage", {
    superClass: "tm.hybrid.Scene", // tm.app.Sceneの3D向け拡張
    init: function() {
        this.superInit();

        // カメラ調整
        this.camera.setPosition(0, 20, 30);
        this.camera.lookAt(new THREE.Vector3(0, 10, 0));
        
        // ライトを動かす
        this.directionalLight
            .on("enterframe", function(e) {
                var f = e.app.frame;
                this.x = Math.cos(f * 0.1) * 10;
                this.z = Math.sin(f * 0.1) * 10;
            });

        // メッシュを表示する
        this.kirara = tm.hybrid.Mesh("silverhawk") // Spriteっぽく使える
            .addChildTo(this)

        //メッシュリスト
        var meshCount = 0;
        var meshList = ["gradriel", "fossil", "r9", "silverhawk"];

        // tweenerも使える
/*
        kirara.tweener.clear()
            .to({ scaleY: 0.9 }, 300, "easeInBack")
            .to({ scaleY: 1.0 }, 300, "easeOutBack")
            .setLoop(true);
*/
        // 2Dスプライトとの併用も可能
        var hiyoko = tm.display.Sprite("hiyoko", 32, 32)
            .setScale(4)
            .setFrameIndex(0)
            .addChildTo(this)
            .on("enterframe", function() {
                this.x += this.vx * 10;
                this.y += this.vy * 10;
                if (this.x < 0 || 640 < this.x) this.vx *= -1;
                if (this.y < 0 || 960 < this.y) this.vy *= -1;
                
                this.frameIndex = (this.frameIndex + 1) % 4;
                this.rotation += 2;
            });
        hiyoko.vx = 1;
        hiyoko.vy = 1;

        var that = this;
        tm.ui.FlatButton({ text: "きりかえ" })
            .setPosition(320, 100)
            .addChildTo(this)
            .on("push", function() {
                meshCount++;
                meshCount %= meshList.length;
//                that.kirara.remove();
                var name = meshList[meshCount];
                that.kirara = tm.hybrid.Mesh("fossil").addChildTo(this);
            });
    },

    update: function(e) {
        // スワイプでくるくるまわす
        var p = e.pointing;
        if (p.getPointing()) {
            this.kirara.vy = p.deltaPosition.x * 0.01;
            this.kirara.rotation.y += this.kirara.vy;
            this.kirara.vx = p.deltaPosition.y * 0.01;
            this.kirara.rotation.x += this.kirara.vx;
        } else {
            if (this.kirara.vy) {
                this.kirara.rotation.y += this.kirara.vy;
                this.kirara.vy *= 0.95;
                if (Math.abs(this.kirara.vy) < 0.1) {
                    this.kirara.vy = 0;
                }
            }
            if (this.kirara.vx) {
                this.kirara.rotation.x += this.kirara.vx;
                this.kirara.vx *= 0.95;
                if (Math.abs(this.kirara.vx) < 0.1) {
                    this.kirara.vx = 0;
                }
            }
        }
    },
});
