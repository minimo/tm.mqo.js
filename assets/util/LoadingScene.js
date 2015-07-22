/*
 *  LoadingScene.js
 *  2014/12/09
 *  @auther minimo  
 *  This Program is MIT license.
 *
 */

tm.define("LoadingScene", {
    superClass: "tm.app.Scene",

    init: function(param) {
        this.superInit();

        this.fromJSON({
            children: {
                stage: {
                    type: "tm.display.CanvasElement",
                },
            }
        });

        this.stage.fromJSON({
            children: {
                bg: {
                    type: "tm.display.Shape",
                    init: [{width: param.width, height: param.height}],
                    originX: 0,
                    originY: 0,
                },
                label: {
                    type: "tm.display.Label",
                    text: "Asset read error!!",
                    x: param.width/2,
                    y: param.height/2-20,
                    align: "center",
                    baseline: "middle",
                    fontSize: 46,
                    shadowBlur: 4,
                    shadowColor: "hsl(190, 100%, 50%)",
                    alpha: 0,
                },
                bar: {
                    type: "tm.ui.Gauge",
                    init: [{
                        width: SC_W*0.4,
                        height: 10,
                        color: "blue",
                        bgColor: "rgba(20, 20, 20, 1)",
                        borderColor: "transparent",
                        borderWidth: 0,
                    }],
                    x: SC_W*0.3,
                    y: SC_H*0.5+20,
                },
            }
        });

        // bg
        var bg = this.stage.bg;
        bg.canvas.clearColor(param.bgColor);

        var text = "LOADING";
        var text_space = [0,31,31,30,20,20,30];
                        //L O  A  D  I  N  G
        var spc = 0;
        for (var i = 0; i < text.length; i++) {
            spc += text_space[i];
            var x = param.width/2-84+spc;
            var y = param.height/2-20;

            var base = tm.app.Object2D()
                .addChildTo(this.stage)
                .setPosition(x, y);
            base.tweener
                .wait(500+150*i)
                .moveBy(0, -30, 300, "easeOutSine")
                .moveBy(0, 30, 600, "easeOutBounce")
                .wait(1000)
                .moveBy(0, -30, 300, "easeOutSine")
                .moveBy(0, 30, 600, "easeOutBounce")
                .wait(1000)
                .moveBy(0, -30, 300, "easeOutSine")
                .moveBy(0, 30, 600, "easeOutBounce")
                .wait(1000)
                .moveBy(0, -30, 300, "easeOutSine")
                .moveBy(0, 30, 600, "easeOutBounce")
                .wait(1000)
                .moveBy(0, -30, 300, "easeOutSine")
                .moveBy(0, 30, 600, "easeOutBounce")

            var chr = tm.display.Label(text.charAt(i), 30)
                .addChildTo(base)
                .setAlign("center")
                .setBaseline("middle")
                .setShadowBlur(4)
                .setShadowColor("hsl(190, 100%, 50%)");
            chr.tweener
                .to({alpha:0.3}, 1000, "easeInOutSine")
                .to({alpha:1}, 1000, "easeInOutSine")
                .to({alpha:0.3}, 1000, "easeInOutSine")
                .to({alpha:1}, 1000, "easeInOutSine")
                .to({alpha:0.3}, 1000, "easeInOutSine")
                .to({alpha:1}, 1000, "easeInOutSine")
                .to({alpha:0.3}, 1000, "easeInOutSine")
                .to({alpha:1}, 1000, "easeInOutSine")
                .to({alpha:0.3}, 1000, "easeInOutSine")
                .to({alpha:1}, 1000, "easeInOutSine")
                .to({alpha:0.0}, 1000, "easeInOutSine");
//                .setLoop(true);
        }

        this.stage.label.tweener.wait(11000).fadeIn(10);

        // bar
        var bar = this.stage.bar;
        bar.animationFlag = false;
        bar.value = 0;
        bar.animationFlag = true;
        bar.animationTime = 100;

        var stage = this.stage;
        stage.alpha = 0.0;
        stage.tweener.clear().fadeIn(100).call(function() {
            if (param.assets) {
                var loader = tm.asset.Loader();
                loader.onload = function() {
                    stage.tweener.clear().wait(200).fadeOut(200).call(function() {
                        if (param.nextScene) {
                                this.app.replaceScene(param.nextScene());
                        }
                        var e = tm.event.Event("load");
                        this.fire(e);
                    }.bind(this));
                }.bind(this);

                loader.onprogress = function(e) {
                    // update bar
                    bar.value = e.progress*100;

                    // dispatch event
                    var event = tm.event.Event("progress");
                    event.progress = e.progress;
                    this.fire(event);
                }.bind(this);

                loader.load(param.assets);
            }
        }.bind(this));
    },
});
