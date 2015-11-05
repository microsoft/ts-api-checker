/// <reference path="../types/tsd" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var utils = require("./utils");
var types = {};
function storeTypes(t, prefix) {
    var kind = t.kind;
    if (kind === "constructor") {
        kind = "ctor";
    }
    var checker = checkers[kind];
    if (!checker) {
        utils.throwError("Unknown kind: " + kind);
    }
    checker.store(t, prefix);
}
exports.storeTypes = storeTypes;
function checkTypes(t, prefix) {
    var kind = t.kind;
    if (kind === "constructor") {
        kind = "ctor";
    }
    var checker = checkers[kind];
    if (!checker) {
        utils.throwError("Unknown kind: " + kind);
    }
    checker.check(t, prefix);
}
exports.checkTypes = checkTypes;
var checkers = {};
var BaseChecker = (function () {
    function BaseChecker() {
    }
    BaseChecker.prototype.store = function (t, prefix) {
        var key = this.getKey(t, prefix);
        types[key] = t;
        utils.consoleLog(key);
        return key;
    };
    BaseChecker.prototype.check = function (t, prefix) {
        var key = this.getKey(t, prefix);
        types[key] = t;
        utils.consoleLog(key);
        return key;
    };
    BaseChecker.prototype.toTypeString = function (t) {
        return "";
    };
    BaseChecker.prototype.getKey = function (t, prefix) {
        return (prefix || "") + ":" + (t.static ? "static-" : "") + t.kind + ":" + this.getName(t);
    };
    BaseChecker.prototype.getName = function (t) {
        return t.name;
    };
    return BaseChecker;
})();
var ModuleChecker = (function (_super) {
    __extends(ModuleChecker, _super);
    function ModuleChecker() {
        _super.apply(this, arguments);
    }
    ModuleChecker.prototype.store = function (t, prefix) {
        var key = _super.prototype.store.call(this, t, prefix);
        for (var _i = 0, _a = t.declares; _i < _a.length; _i++) {
            var d = _a[_i];
            if (d.kind !== "variable" && d.kind !== "import") {
                storeTypes(d, key);
            }
        }
        return key;
    };
    return ModuleChecker;
})(BaseChecker);
checkers["module"] = new ModuleChecker();
var InterfaceChecker = (function (_super) {
    __extends(InterfaceChecker, _super);
    function InterfaceChecker() {
        _super.apply(this, arguments);
    }
    InterfaceChecker.prototype.store = function (t, prefix) {
        var key = _super.prototype.store.call(this, t, prefix);
        for (var _i = 0, _a = (t.signatures || []); _i < _a.length; _i++) {
            var s = _a[_i];
            storeTypes(s, key);
        }
        return key;
    };
    return InterfaceChecker;
})(BaseChecker);
checkers["interface"] = new InterfaceChecker();
var ObjectChecker = (function (_super) {
    __extends(ObjectChecker, _super);
    function ObjectChecker() {
        _super.apply(this, arguments);
    }
    ObjectChecker.prototype.getName = function (t) {
        return "";
    };
    return ObjectChecker;
})(BaseChecker);
checkers["object"] = new ObjectChecker();
var EnumChecker = (function (_super) {
    __extends(EnumChecker, _super);
    function EnumChecker() {
        _super.apply(this, arguments);
    }
    EnumChecker.prototype.store = function (t, prefix) {
        var key = _super.prototype.store.call(this, t, prefix);
        for (var _i = 0, _a = (t.members || []); _i < _a.length; _i++) {
            var v = _a[_i];
            var vKey = key + ":" + v.name;
            utils.consoleLog(vKey);
            types[vKey] = v;
        }
        return key;
    };
    return EnumChecker;
})(BaseChecker);
checkers["enum"] = new EnumChecker();
var ClassChecker = (function (_super) {
    __extends(ClassChecker, _super);
    function ClassChecker() {
        _super.apply(this, arguments);
    }
    ClassChecker.prototype.store = function (t, prefix) {
        var key = _super.prototype.store.call(this, t, prefix);
        for (var _i = 0, _a = (t.members || []); _i < _a.length; _i++) {
            var m = _a[_i];
            if (!m.private) {
                storeTypes(m, key);
            }
        }
        return key;
    };
    return ClassChecker;
})(BaseChecker);
checkers["class"] = new ClassChecker();
var PropertyChecker = (function (_super) {
    __extends(PropertyChecker, _super);
    function PropertyChecker() {
        _super.apply(this, arguments);
    }
    PropertyChecker.prototype.store = function (t, prefix) {
        var key = _super.prototype.store.call(this, t, prefix);
        if (typeof t.type === "object") {
            storeTypes(t.type, key);
        }
        return key;
    };
    return PropertyChecker;
})(BaseChecker);
checkers["property"] = new PropertyChecker();
var ArrayChecker = (function (_super) {
    __extends(ArrayChecker, _super);
    function ArrayChecker() {
        _super.apply(this, arguments);
    }
    ArrayChecker.prototype.getName = function (t) {
        return "";
    };
    return ArrayChecker;
})(BaseChecker);
checkers["array"] = new ArrayChecker();
var FieldChecker = (function (_super) {
    __extends(FieldChecker, _super);
    function FieldChecker() {
        _super.apply(this, arguments);
    }
    FieldChecker.prototype.getName = function (t) {
        return (t.static ? "static" : "member") + ":" + t.name;
    };
    return FieldChecker;
})(BaseChecker);
checkers["field"] = new FieldChecker();
var UnionChecker = (function (_super) {
    __extends(UnionChecker, _super);
    function UnionChecker() {
        _super.apply(this, arguments);
    }
    UnionChecker.prototype.getName = function (t) {
        return "";
    };
    return UnionChecker;
})(BaseChecker);
checkers["union"] = new UnionChecker();
var ReferenceChecker = (function (_super) {
    __extends(ReferenceChecker, _super);
    function ReferenceChecker() {
        _super.apply(this, arguments);
    }
    ReferenceChecker.prototype.getName = function (t) {
        return "";
    };
    ReferenceChecker.prototype.store = function (t, prefix) {
        var key = _super.prototype.store.call(this, t, prefix);
        if (typeof t.type === "object") {
            storeTypes(t.type, key);
        }
        return key;
    };
    return ReferenceChecker;
})(BaseChecker);
checkers["reference"] = new ReferenceChecker();
var FunctionChecker = (function (_super) {
    __extends(FunctionChecker, _super);
    function FunctionChecker() {
        _super.apply(this, arguments);
    }
    FunctionChecker.prototype.getName = function (t) {
        return t.name || "";
    };
    FunctionChecker.prototype.store = function (t, prefix) {
        var key = _super.prototype.store.call(this, t, prefix);
        var params = t.parameters || [];
        for (var i = 0; i < params.length; i++) {
            var pKey = key + ":param:" + i;
            utils.consoleLog(pKey);
            types[pKey] = params[i];
        }
        return key;
    };
    return FunctionChecker;
})(BaseChecker);
checkers["function"] = new FunctionChecker();
var MethodChecker = (function (_super) {
    __extends(MethodChecker, _super);
    function MethodChecker() {
        _super.apply(this, arguments);
    }
    return MethodChecker;
})(FunctionChecker);
checkers["method"] = new MethodChecker();
var CallChecker = (function (_super) {
    __extends(CallChecker, _super);
    function CallChecker() {
        _super.apply(this, arguments);
    }
    CallChecker.prototype.toTypeString = function (t) {
        var params = t.parameters || [];
        return params.map(function (p) { return JSON.stringify(p.type); }).join(",") + ":" + JSON.stringify(t.returns);
    };
    CallChecker.prototype.getName = function (t) {
        return this.toTypeString(t);
    };
    return CallChecker;
})(BaseChecker);
checkers["call"] = new CallChecker();
var ConstructorChecker = (function (_super) {
    __extends(ConstructorChecker, _super);
    function ConstructorChecker() {
        _super.apply(this, arguments);
    }
    return ConstructorChecker;
})(CallChecker);
checkers["ctor"] = new ConstructorChecker();
var IndexChecker = (function (_super) {
    __extends(IndexChecker, _super);
    function IndexChecker() {
        _super.apply(this, arguments);
    }
    IndexChecker.prototype.getName = function (t) {
        return "";
    };
    return IndexChecker;
})(BaseChecker);
checkers["index"] = new IndexChecker();
