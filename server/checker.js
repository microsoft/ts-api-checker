/// <reference path="../types/tsd" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var utils = require("./utils");
var types = {};
var exemptedAnnotation = "exemptedapi";
function setExemptedAnnotation(annotation) {
    exemptedAnnotation = annotation;
}
exports.setExemptedAnnotation = setExemptedAnnotation;
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
        this.storeByKey(key, t);
        return key;
    };
    BaseChecker.prototype.check = function (t, prefix) {
        var key = this.getKey(t, prefix);
        return {
            key: key,
            exempted: this.checkByKey(key, t)
        };
    };
    BaseChecker.prototype.toTypeString = function (t) {
        return "";
    };
    BaseChecker.prototype.getKey = function (t, prefix) {
        return (prefix || "") + "/" + (t.static ? "static-" : "") + t.kind + ":" + this.getName(t);
    };
    BaseChecker.prototype.getName = function (t) {
        return t.name;
    };
    BaseChecker.prototype.storeByKey = function (key, t) {
        types[key] = t;
        utils.consoleLog("Storing " + key);
    };
    BaseChecker.prototype.checkByKey = function (key, t) {
        var exempted = false;
        if (!(key in types)) {
            utils.consoleLog("actual check failed " + key);
            if (this.isExempted(t)) {
                exempted = true;
            }
            else {
                utils.throwCompatError(key + " cannot be found.");
            }
        }
        return exempted;
    };
    BaseChecker.prototype.isExempted = function (t) {
        for (var _i = 0, _a = (t.annotations || []); _i < _a.length; _i++) {
            var a = _a[_i];
            if (a.name === exemptedAnnotation && a.value === true) {
                return true;
            }
        }
        return false;
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
        for (var _i = 0, _a = (t.declares || []); _i < _a.length; _i++) {
            var d = _a[_i];
            if (d.kind !== "variable" && d.kind !== "import") {
                storeTypes(d, key);
            }
        }
        return key;
    };
    ModuleChecker.prototype.check = function (t, prefix) {
        var checkResult = _super.prototype.check.call(this, t, prefix);
        if (!checkResult.exempted || t.name === "_global_") {
            var declares = t.declares || [];
            utils.consoleLog("Checking declares of " + checkResult.key + " (" + declares.length + ")");
            for (var _i = 0; _i < declares.length; _i++) {
                var d = declares[_i];
                if (d.kind !== "variable" && d.kind !== "import") {
                    checkTypes(d, checkResult.key);
                }
            }
        }
        return checkResult;
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
    InterfaceChecker.prototype.check = function (t, prefix) {
        var checkResult = _super.prototype.check.call(this, t, prefix);
        if (!checkResult.exempted) {
            for (var _i = 0, _a = (t.signatures || []); _i < _a.length; _i++) {
                var s = _a[_i];
                checkTypes(s, checkResult.key);
            }
        }
        return checkResult;
    };
    return InterfaceChecker;
})(BaseChecker);
checkers["interface"] = new InterfaceChecker();
var EnumChecker = (function (_super) {
    __extends(EnumChecker, _super);
    function EnumChecker() {
        _super.apply(this, arguments);
    }
    EnumChecker.prototype.store = function (t, prefix) {
        var key = _super.prototype.store.call(this, t, prefix);
        for (var _i = 0, _a = (t.members || []); _i < _a.length; _i++) {
            var v = _a[_i];
            var vKey = key + ":" + v.name + ":" + v.value;
            this.storeByKey(vKey, v);
        }
        return key;
    };
    EnumChecker.prototype.check = function (t, prefix) {
        var checkResult = _super.prototype.check.call(this, t, prefix);
        if (!checkResult.exempted) {
            for (var _i = 0, _a = (t.members || []); _i < _a.length; _i++) {
                var v = _a[_i];
                var vKey = checkResult.key + ":" + v.name + ":" + v.value;
                this.checkByKey(vKey, v);
            }
        }
        return checkResult;
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
    ClassChecker.prototype.check = function (t, prefix) {
        var checkResult = _super.prototype.check.call(this, t, prefix);
        for (var _i = 0, _a = (t.members || []); _i < _a.length; _i++) {
            var m = _a[_i];
            if (!m.private) {
                checkTypes(m, checkResult.key);
            }
        }
        return checkResult;
    };
    return ClassChecker;
})(BaseChecker);
checkers["class"] = new ClassChecker();
var PropertyChecker = (function (_super) {
    __extends(PropertyChecker, _super);
    function PropertyChecker() {
        _super.apply(this, arguments);
    }
    PropertyChecker.prototype.isFunction = function (t) {
        return typeof t.type === "object" && t.type.kind === "function";
    };
    PropertyChecker.prototype.getName = function (t) {
        if (this.isFunction(t)) {
            return t.name;
        }
        else {
            return t.name + ":" + JSON.stringify(t.type);
        }
    };
    PropertyChecker.prototype.store = function (t, prefix) {
        var key = _super.prototype.store.call(this, t, prefix);
        if (this.isFunction(t)) {
            storeTypes(t.type, key);
        }
        return key;
    };
    PropertyChecker.prototype.check = function (t, prefix) {
        var checkResult = _super.prototype.check.call(this, t, prefix);
        if (this.isFunction(t)) {
            checkTypes(t.type, checkResult.key);
        }
        return checkResult;
    };
    return PropertyChecker;
})(BaseChecker);
checkers["property"] = new PropertyChecker();
var FieldChecker = (function (_super) {
    __extends(FieldChecker, _super);
    function FieldChecker() {
        _super.apply(this, arguments);
    }
    FieldChecker.prototype.getName = function (t) {
        return (t.static ? "static" : "member") + ":" + t.name + ":" + JSON.stringify(t.type);
    };
    return FieldChecker;
})(BaseChecker);
checkers["field"] = new FieldChecker();
var FunctionChecker = (function (_super) {
    __extends(FunctionChecker, _super);
    function FunctionChecker() {
        _super.apply(this, arguments);
    }
    FunctionChecker.prototype.getParamKey = function (p, i, key) {
        return key + ":" + (p.optional ? "optional" : "required") + "-param:" + i + ":" + JSON.stringify(p);
    };
    FunctionChecker.prototype.getReturnsKey = function (t, key) {
        return key + ":returns:" + JSON.stringify(t.returns);
    };
    FunctionChecker.prototype.getName = function (t) {
        return (t.name || "_noname_");
    };
    FunctionChecker.prototype.store = function (t, prefix) {
        var key = _super.prototype.store.call(this, t, prefix);
        var params = t.parameters || [];
        for (var i = 0; i < params.length; i++) {
            var p = params[i];
            var pKey = this.getParamKey(p, i, key);
            this.storeByKey(pKey, p);
        }
        var returnsKey = this.getReturnsKey(t, key);
        this.storeByKey(returnsKey, {});
        return key;
    };
    FunctionChecker.prototype.check = function (t, prefix) {
        var checkResult = _super.prototype.check.call(this, t, prefix);
        utils.consoleLog("check function params for " + checkResult.key);
        if (!checkResult.exempted) {
            var params = t.parameters || [];
            for (var i = 0; i < params.length; i++) {
                var p = params[i];
                var pKey = this.getParamKey(p, i, checkResult.key);
                this.checkByKey(pKey, p);
            }
            var returnsKey = this.getReturnsKey(t, checkResult.key);
            this.checkByKey(returnsKey, {});
        }
        return checkResult;
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
    return CallChecker;
})(FunctionChecker);
checkers["call"] = new CallChecker();
var ConstructorChecker = (function (_super) {
    __extends(ConstructorChecker, _super);
    function ConstructorChecker() {
        _super.apply(this, arguments);
    }
    ConstructorChecker.prototype.getName = function (t) {
        return "_constructor_";
    };
    return ConstructorChecker;
})(FunctionChecker);
checkers["ctor"] = new ConstructorChecker();
var IndexChecker = (function (_super) {
    __extends(IndexChecker, _super);
    function IndexChecker() {
        _super.apply(this, arguments);
    }
    IndexChecker.prototype.getName = function (t) {
        return "param:" + (t.parameter ? JSON.stringify(t.parameter.type) : "") + ":returns:" + (t.returns ? JSON.stringify(t.returns) : "");
    };
    return IndexChecker;
})(BaseChecker);
checkers["index"] = new IndexChecker();
