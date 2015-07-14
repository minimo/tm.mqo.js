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

            hiyoko: "assets/hiyoco_nomal_full.png",

//            gradriel: "assets/gradriel_pose.mqo",
            test: "assets/test.mqo",
        },
        nextScene: KiraraOnStage,
    }));
});

tm.define("KiraraOnStage", {
    superClass: "tm.hybrid.Scene", // tm.app.Sceneの3D向け拡張
    init: function() {
        this.superInit();

        // カメラ調整
        this.camera.setPosition(0, 20, 50);
        this.camera.lookAt(new THREE.Vector3(0, 10, 0));
        
        // ライトを動かす
        this.directionalLight
            .on("enterframe", function(e) {
                var f = e.app.frame;
                this.x = Math.cos(f * 0.1) * 10;
                this.z = Math.sin(f * 0.1) * 10;
            });

        // メッシュを表示する
        var kirara = tm.hybrid.Mesh("kirara") // Spriteっぽく使える
            .addChildTo(this)
            .on("enterframe", function() {
                if (this.rolling) this.rotationY += 10; // Y軸回転
            });
        kirara.rolling = false;

        var test = tm.hybrid.Mesh("test").addChildTo(this);

        // tweenerも使える
        kirara.tweener.clear()
            .to({ scaleY: 0.9 }, 300, "easeInBack")
            .to({ scaleY: 1.0 }, 300, "easeOutBack")
            .setLoop(true);

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

        tm.ui.FlatButton({ text: "かいてん" })
            .setPosition(320, 100)
            .addChildTo(this)
            .on("push", function() {
                kirara.rolling = !kirara.rolling;
                this.label.text = kirara.rolling ? "とまる" : "かいてん";
            });
    }
});
