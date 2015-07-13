(function() {
    tm.asset = tm.asset || {};

    _modelPath = "";

    tm.define("tm.asset.MQO", {
        superClass: "tm.event.EventDispatcher",

        model: null,

        init: function(path) {
            this.superInit();
            this.loadFromURL(path);
        },

        loadFromURL: function(path) {
            var modelurl = path.split("/");
            _modelPath = "";
            for (var i = 0, len = modelurl.length; i < len-1; i++) {
                _modelPath += modelurl[i];
            }

            var req = new XMLHttpRequest();
            req.open("GET", path, true);
            req.onload = function() {
                var data = req.responseText;
                that.loadFromData(data);
            };
            req.send(null);
            var that = this;
        },

        loadFromData: function(data) {
            this.model = tm.MQOModel(data);
            this.flare("load");
        },
    });

    tm.asset.Loader.register("mqo", function(path) {
        return tm.asset.MQO(path);
    });

    tm.define("tm.MQOModel", {
        meshes: [],
        _rawMeshes: [],
        _rawMaterials: null,
        
        init: function(data) {
            this.parse(data);
            this.convert();
        },

        parse: function(data) {
            var materialText = data.match(/^Material [\s\S]*?^\}/m);
            this._rawMaterials = tm.MQOMaterial(materialText[0]);

            var objectText = data.match(/^Object [\s\S]*?^\}/gm);
            for (var i = 0, len = objectText.length; i < len; ++i) {
                var mesh = tm.MQOMesh(objectText[i]);
                this._rawMeshes.push(mesh);
            }
        },

        convert: function(){
            this.meshes = [];
            for (var i = 0, len = this._rawMeshes.length; i < len; i++) {
                var mesh = this._rawMeshes[i];
                var list = mesh.convert(this._rawMaterials);
                for (var j = 0, len = list.length; j < len; j++) {
                    this.meshes.push(list[j]);
                }
            }
        },
    });

    tm.define("tm.MQOMesh", {
        vertices: [],
        faces: [],
        vertNormals: [],
        
        facet: 59.5,

        mirror: 0,
        mirrorAxis: 0,

        init: function(text) {
            this.parse(text);
        },

        parse:function(text){
            var name = text.split(' ');
            this.name = name[1].replace(/"/g, "");

            var facet = text.match(/facet ([0-9\.]+)/);
            if( facet ){ this.facet = Number(facet[1]); }

            var visible = text.match(/visible ([0-9\.]+)/);
            if( visible ){ this.visible = Number(visible[1]); }

            var mirror = text.match(/mirror ([0-9])/m);
            if( mirror ){
                this.mirror = Number(mirror[1]);

                var mirrorAxis = text.match(/mirror_axis ([0-9])/m);
                if( mirrorAxis ){
                    this.mirrorAxis = Number(mirrorAxis[1]);
                }
            }

            var vertex_txt = text.match(/vertex ([0-9]+).+\{\s([\w\W]+)}$/gm);
            this._parseVertices( RegExp.$1, RegExp.$2 );

            var face_txt = text.match(/face ([0-9]+).+\{\s([\w\W]+)}$/gm);
            this._parseFaces( RegExp.$1, RegExp.$2 );
        },

        convert: function(materials){
            if( this.visible == 0 ){
                return [];
            }

            var facemat = [];
            facemat[facemat.length] = this.faces[0].m[0];
            for (var i = 0, lf = this.faces.length; i < lf; i++) {
                var fm = -1;
                for (var j = 0, lfm = facemat.length; j < lfm; j++) {
                    if( facemat[j] != this.faces[i].m[0] )fm = this.faces[i].m[0];
                }
                if( fm != -1 )facemat.push(fm);
            }

            var meshList = []
            for (var mn = 0; mn < facemat.length; mn++) {
                var matnum = facemat[mn];
                var sp = this.build(matnum, materials.materials[matnum]);
                meshList.push(sp);
            }
            return meshList;
        },

        build: function(num, mqoMat) {
            var mat = null;
            if(mqoMat.shader == 2) {
                mat = new THREE.MeshLambertMaterial();
            } else if(mqoMat.shader == 3) {
                mat = new THREE.MeshPhongMaterial();
            } else  {
                mat = new THREE.MeshBasicMaterial();
            }
            var r = mqoMat.col[0];
            var g = mqoMat.col[1];
            var b = mqoMat.col[2];
            if (mat.color) mat.color.setRGB(r*mqoMat.dif, g*mqoMat.dif, b*mqoMat.dif);
            if (mat.emissive) mat.emissive.setRGB(r*mqoMat.emi, g*mqoMat.emi, b*mqoMat.emi);
            if (mat.ambient) mat.ambient.setRGB(r*mqoMat.amb, g*mqoMat.amb, b*mqoMat.amb);
            if (mat.specular) mat.specular.setRGB(r*mqoMat.spc, g*mqoMat.spc, b*mqoMat.spc);
            if (mqoMat.tex) {
                mat.map = THREE.ImageUtils.loadTexture(_modelPath+"/"+mqoMat.tex);
            }
            mat.transparent = true;
            mat.shiness = mqoMat.power;
            mat.opacity = mqoMat.col[3]

            var scale = 10;
            var geo = new THREE.Geometry();
            for(var i = 0; i < this.vertices.length; i+=3) {
                geo.vertices.push(new THREE.Vector3(
                    this.vertices[i+0]*scale,
                    this.vertices[i+1]*scale,
                    this.vertices[i+2]*scale));
            }

            for (var i = 0, len = this.faces.length; i < len; i++) {
                var face = this.faces[i];
                var vIndex = face.v;
                var index = geo.vertices.length;
                if (face.vNum == 3) {
                    var face3 = new THREE.Face3(vIndex[2], vIndex[1], vIndex[0], undefined, undefined, face.m[0]);
                    geo.faces.push(face3);

                    geo.faceVertexUvs[0].push([
                        new THREE.Vector2(face.uv[4], 1.0 - face.uv[5]),
                        new THREE.Vector2(face.uv[2], 1.0 - face.uv[3]),
                        new THREE.Vector2(face.uv[0], 1.0 - face.uv[1])]);
                } else if (face.vNum == 4) {
                }
            }

            var obj = new THREE.Mesh(geo, mat);
            return obj;
        },

        _parseVertices: function(num, text) {
            var vertexTextList = text.split('\n');
            for (var i = 1; i <= num; i++) {
                var vertex = vertexTextList[i].split(' ');
                vertex[0] = Number(vertex[0])*0.01;
                vertex[1] = Number(vertex[1])*0.01;
                vertex[2] = Number(vertex[2])*0.01;
                this.vertices.push(vertex);
            }

            if (this.mirror) {
                var self = this;
                var toMirror = (function(){
                    return {
                        1: function(v) { return [ v[0]*-1, v[1], v[2] ]; },
                        2: function(v) { return [ v[0], v[1]*-1, v[2] ]; },
                        4: function(v) { return [ v[0], v[1], v[2]*-1 ]; },
                    }[self.mirrorAxis];
                })();
                var len = this.vertices.length;
                for (var i = 0; i < len; i++) {
                    this.vertices.push(toMirror(this.vertices[i]));
                }
            }
        },

        _parseFaces: function(num, text) {
            var faceTextList = text.split('\n');

            var calcNormalize = function(a, b, c) {
                var v1 = [ a[0] - b[0], a[1] - b[1], a[2] - b[2] ];
                var v2 = [ c[0] - b[0], c[1] - b[1], c[2] - b[2] ];
                var v3 = [
                    v1[1]*v2[2] - v1[2]*v2[1],
                    v1[2]*v2[0] - v1[0]*v2[2],
                    v1[0]*v2[1] - v1[1]*v2[0]
                ];
                var len = Math.sqrt(v3[0]*v3[0] + v3[1]*v3[1] + v3[2]*v3[2]);
                v3[0] /= len;
                v3[1] /= len;
                v3[2] /= len;

                return v3;
            };

            for (var i = 1; i <= num; i++ ){

                var faceText = faceTextList[i].replace(/^\s+|\s+$/g, "");

                var vertex_num = Number(faceText[0]);

                var info = faceText.match(/([A-Za-z]+)\(([\w\s\-\.\(\)]+?)\)/gi);
                var face = { vNum: vertex_num };
                
                for (var j = 0, len = info.length; j < len; j++) {
                    var m = info[j].match(/([A-Za-z]+)\(([\w\s\-\.\(\)]+?)\)/);
                    var key = m[1].toLowerCase();
                    var value = m[2].split(" ");
                    value.forEach(function(elm, i, arr){
                        arr[i] = Number(elm);
                    });
                    face[key] = value;
                }

                if (!face.uv) {
                    face.uv = [0, 0, 0, 0, 0, 0, 0, 0];
                }

                if (!face.m) {
                    face.m = [undefined];
                }

                if (face.v.length > 2) {
                    face.n = calcNormalize(this.vertices[face.v[0]], this.vertices[face.v[1]], this.vertices[face.v[2]]);
                }

                this.faces.push(face);
            }

            if( this.mirror ){
                var swap = function(a,b){ var temp = this[a]; this[a] = this[b]; this[b] = temp; return this; };
                var len = this.faces.length;
                var vertexOffset = (this.vertices.length/2);
                for(var i = 0; i < len; i++) {
                    var targetFace = this.faces[i];
                    var face = {
                        uv  : [],
                        v   : [],
                        vNum: targetFace.vNum,
                    };
                    for (var j = 0; j < targetFace.v.length; j++) { face.v[j] = targetFace.v[j] + vertexOffset; }
                    for (var j = 0; j < targetFace.uv.length; j++) { face.uv[j] = targetFace.uv[j]; }

                    if (face.vNum == 3) {
                        swap.call(face.v, 1, 2);
                    } else {
                        swap.call(face.v, 0, 1);
                        swap.call(face.v, 2, 3);
                    }

                    face.n = targetFace.n;
                    face.m = targetFace.m;

                    this.faces.push(face);
                }
            }

            var vertNormal = Array(this.vertices.length);
            for (var i = 0, len = this.vertices.length; i < len; i++) vertNormal[i] = [];

            for (var i = 0; i < this.faces.length; i++) {
                var face = this.faces[i];
                var vIndices = face.v;

                for (var j = 0; j < face.vNum; j++) {
                    var index = vIndices[j];
                    vertNormal[index].push.apply(vertNormal[index], face.n);
                }
            }

            for (var i = 0; i < vertNormal.length; i++) {
                var vn = vertNormal[i];
                var result = [0, 0, 0];
                var len = vn.length/3;
                for (var j = 0; j < len; j++) {
                    result[0] += vn[j*3+0];
                    result[1] += vn[j*3+1];
                    result[2] += vn[j*3+2];
                }

                result[0] /= len;
                result[1] /= len;
                result[2] /= len;

                var len = Math.sqrt(result[0]*result[0] + result[1]*result[1] + result[2]*result[2]);
                result[0] /= len;
                result[1] /= len;
                result[2] /= len;
                
                this.vertNormals[i] = result;
            }
        },
    });


    tm.define("tm.MQOMaterial", {
        materials: [],

        init: function(data) {
            this.parse(data);
        },

        parse: function(data) {
//            var infoText    = data.match(/^Material [0-9]* \{\r\n([\s\S]*?)\n^\}$/m);
            var infoText = data.match(/^Material [\s\S]*?^\}/m);
            var matTextList = infoText[1].split('\n');

            for (var i = 0, len = matTextList.length; i < len; i++) {
                var mat = {};

                var matText = matTextList[i].replace(/^\s+|\s+$/g, "");
                var info = matText.match(/([A-Za-z]+)\(([\w\W]+?)\)/gi);

                var nl = matText.split(' ');
                mat['name'] = nl[0].replace(/"/g, "");

                for( var j = 0, len2 = info.length; j < len2; j++ ){
                    var m = info[j].match(/([A-Za-z]+)\(([\w\W]+?)\)/);
                    var key = m[1].toLowerCase();
                    var value = null;

                    if( key != "tex" && key != "aplane" ){

                        value = m[2].split(" ");
                        value.forEach(function(elm, i, arr){
                            arr[i] = Number(elm);
                        });
                    }else{

                        value = m[2].replace(/"/g, "");
                    }
                    mat[key] = value;
                }
                this.materials.push(mat);
            }
        },
        convert: function() {
        },
    });

})();

