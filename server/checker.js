/// <reference path="../types/tsd" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var utils = require("./utils");
var types = {};
var exemptedAnnotation = "exemptedapi";
var excludedKinds = ["variable", "import"];
function setExemptedAnnotation(annotation) {
    exemptedAnnotation = annotation;
}
exports.setExemptedAnnotation = setExemptedAnnotation;
function setExcludedKinds(kinds) {
    excludedKinds = kinds.split(",").map(function (k) { return k.trim(); });
}
exports.setExcludedKinds = setExcludedKinds;
function isExcluded(t) {
    return excludedKinds.indexOf(t.kind) >= 0;
}
function findChecker(t) {
    var kind = t.kind;
    if (kind === "constructor") {
        kind = "ctor";
    }
    var checker = checkers[kind];
    if (!checker) {
        utils.throwError("Unknown kind: " + kind);
    }
    return checker;
}
function storeTypes(t, prefix) {
    findChecker(t).store(t, prefix);
}
exports.storeTypes = storeTypes;
function checkTypes(t, prefix) {
    findChecker(t).check(t, prefix);
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
    BaseChecker.prototype.getKey = function (t, prefix) {
        return (prefix || "") + "**" + (t.static ? "static-" : "") + t.kind + "::" + this.getId(t);
    };
    BaseChecker.prototype.getId = function (t) {
        return t.name;
    };
    BaseChecker.prototype.storeByKey = function (key, t) {
        types[key] = t;
        utils.consoleLog("Storing " + key);
    };
    BaseChecker.prototype.checkByKey = function (key, t) {
        var exempted = this.isExempted(t);
        if (!(key in types) && !exempted) {
            utils.throwCompatError(key);
        }
        return exempted;
    };
    BaseChecker.prototype.isExempted = function (t) {
        return (t.annotations || [])
            .some(function (a) { return a.name === exemptedAnnotation && a.value === true; });
    };
    return BaseChecker;
})();
var ModuleChecker = (function (_super) {
    __extends(ModuleChecker, _super);
    function ModuleChecker() {
        _super.apply(this, arguments);
    }
    ModuleChecker.prototype.store = function (t, prefix) {
        // Store module itself first
        var key = _super.prototype.store.call(this, t, prefix);
        // Store declares inside this module
        (t.declares || []).filter(function (d) { return !isExcluded(d); })
            .forEach(function (d) { return storeTypes(d, key); });
        return key;
    };
    ModuleChecker.prototype.check = function (t, prefix) {
        // Check module itself first
        var checkResult = _super.prototype.check.call(this, t, prefix);
        // Don't check declares in this module if the module is global or module is exempted 
        if (!checkResult.exempted || t.name === "_global_") {
            var declares = t.declares || [];
            utils.consoleLog("Checking declares of " + checkResult.key + " (" + declares.length + ")");
            declares.filter(function (d) { return !isExcluded(d); })
                .forEach(function (d) { return checkTypes(d, checkResult.key); });
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
        // Store interface itself first
        var key = _super.prototype.store.call(this, t, prefix);
        // Store signatures of the interface
        (t.signatures || []).forEach(function (s) { return storeTypes(s, key); });
        return key;
    };
    InterfaceChecker.prototype.check = function (t, prefix) {
        // Check interface itself first
        var checkResult = _super.prototype.check.call(this, t, prefix);
        // Don't check signatures of this interface if interface is exempted
        if (!checkResult.exempted) {
            (t.signatures || []).forEach(function (s) { return checkTypes(s, checkResult.key); });
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
        var _this = this;
        // Store enum itself first
        var key = _super.prototype.store.call(this, t, prefix);
        // Store enum members
        (t.members || []).forEach(function (v) {
            var vKey = key + "::" + v.name + ":" + v.value;
            _this.storeByKey(vKey, v);
        });
        return key;
    };
    EnumChecker.prototype.check = function (t, prefix) {
        var _this = this;
        // Check enum itself first
        var checkResult = _super.prototype.check.call(this, t, prefix);
        // Don't check members of this enum if enum is exempted
        if (!checkResult.exempted) {
            (t.members || []).forEach(function (v) {
                var vKey = checkResult.key + "::" + v.name + ":" + v.value;
                _this.checkByKey(vKey, v);
            });
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
        // Store class itself first
        var key = _super.prototype.store.call(this, t, prefix);
        // Store class members
        (t.members || []).filter(function (m) { return !m.private; }).forEach(function (m) { return storeTypes(m, key); });
        return key;
    };
    ClassChecker.prototype.check = function (t, prefix) {
        // Check class itself first
        var checkResult = _super.prototype.check.call(this, t, prefix);
        // Don't check members of this class if class is exempted
        if (!checkResult.exempted) {
            (t.members || []).filter(function (m) { return !m.private; }).forEach(function (m) { return checkTypes(m, checkResult.key); });
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
    PropertyChecker.prototype.getId = function (t) {
        if (this.isFunction(t)) {
            return t.name;
        }
        else {
            return t.name + ":" + JSON.stringify(t.type);
        }
    };
    PropertyChecker.prototype.store = function (t, prefix) {
        // Store property itself first
        var key = _super.prototype.store.call(this, t, prefix);
        // Store sub members if property is of type function
        if (this.isFunction(t)) {
            storeTypes(t.type, key);
        }
        return key;
    };
    PropertyChecker.prototype.check = function (t, prefix) {
        // Check property itself first
        var checkResult = _super.prototype.check.call(this, t, prefix);
        // Don't check if this property is exempted or property type is not function
        if (!checkResult.exempted && this.isFunction(t)) {
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
    FieldChecker.prototype.getId = function (t) {
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
        return key + "**" + (p.optional ? "optional" : "required") + "-param:" + (i + 1) + "::" + JSON.stringify(p);
    };
    FunctionChecker.prototype.getReturnsKey = function (t, key) {
        return key + "**returns::" + JSON.stringify(t.returns);
    };
    FunctionChecker.prototype.getId = function (t) {
        return (t.name || "_noname_");
    };
    FunctionChecker.prototype.store = function (t, prefix) {
        var _this = this;
        // Store function itself first
        var key = _super.prototype.store.call(this, t, prefix);
        // Store function params
        (t.parameters || []).forEach(function (p, i) {
            var pKey = _this.getParamKey(p, i, key);
            _this.storeByKey(pKey, p);
        });
        // Store returns type
        var returnsKey = this.getReturnsKey(t, key);
        this.storeByKey(returnsKey, {});
        return key;
    };
    FunctionChecker.prototype.check = function (t, prefix) {
        var _this = this;
        // Check function itself first
        var checkResult = _super.prototype.check.call(this, t, prefix);
        // Don't check the parameters if the function is exempted
        if (!checkResult.exempted) {
            (t.parameters || []).forEach(function (p, i) {
                var pKey = _this.getParamKey(p, i, checkResult.key);
                if (prefix.indexOf("SearchCore") >= 0) {
                    console.log('test' + pKey);
                }
                _this.checkByKey(pKey, p);
            });
            // Check returns type
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
    ConstructorChecker.prototype.getId = function (t) {
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
    IndexChecker.prototype.getId = function (t) {
        return "param:" + (t.parameter ? JSON.stringify(t.parameter.type) : "") + ":returns:" + (t.returns ? JSON.stringify(t.returns) : "");
    };
    return IndexChecker;
})(BaseChecker);
checkers["index"] = new IndexChecker();
var AliasChecker = (function (_super) {
    __extends(AliasChecker, _super);
    function AliasChecker() {
        _super.apply(this, arguments);
    }
    AliasChecker.prototype.store = function (t, prefix) {
        // Store interface itself first
        var key = _super.prototype.store.call(this, t, prefix);
        // Store the type of this alias
        storeTypes(t.type, key);
        return key;
    };
    AliasChecker.prototype.check = function (t, prefix) {
        // Check interface itself first
        var checkResult = _super.prototype.check.call(this, t, prefix);
        // Don't check signatures of this interface if interface is exempted
        if (!checkResult.exempted) {
            checkTypes(t.type, checkResult.key);
        }
        return checkResult;
    };
    return AliasChecker;
})(BaseChecker);
checkers["alias"] = new AliasChecker();
