/// <reference path="../types/tsd" />

import utils = require("./utils");

var types: ComparedTypes = {};

var exemptedAnnotation = "exemptedapi";
var excludedKinds = ["variable", "import"];

interface CheckResult {
    key: string;
    exempted: boolean;
}

export function setExemptedAnnotation(annotation: string): void {
    exemptedAnnotation = annotation;
}

export function setExcludedKinds(kinds: string): void {
    excludedKinds = kinds.split(",").map(k=> k.trim());
}


function isExcluded(t: IType): boolean {
    return excludedKinds.indexOf(t.kind) >= 0;
}

function findChecker(t: IType): IChecker {
    var kind = t.kind;
    if (kind === "constructor") {
        kind = "ctor";
    }

    var checker = checkers[kind];
    if (!checker) {
        utils.throwError(`Unknown kind: ${kind}`);
    }

    return checker;
}

export function storeTypes(t: IType, prefix: string): void {
    findChecker(t).store(t, prefix);
}

export function checkTypes(t: IType, prefix: string): void {
    findChecker(t).check(t, prefix);
}

interface IChecker {
    store(t: IType, prefix: string): string;
    check(t: IType, prefix: string): CheckResult;
}

var checkers: { [kind: string]: IChecker } = {};

class BaseChecker implements IChecker {
    public store(t: IType, prefix: string): string {
        var key = this.getKey(t, prefix);
        this.storeByKey(key, t);
        return key;
    }

    public check(t: IType, prefix: string): CheckResult {
        var key = this.getKey(t, prefix);
        return {
            key: key,
            exempted: this.checkByKey(key, t)
        }
    }

    protected getKey(t: IType, prefix: string): string {
        return `${prefix || ""}/${t.static ? "static-" : ""}${t.kind}:${this.getId(t) }`;
    }

    protected getId(t: IType): string {
        return t.name;
    }

    protected storeByKey(key: string, t: IType): void {
        types[key] = t;
        utils.consoleLog(`Storing ${key}`);
    }

    protected checkByKey(key: string, t: IType): boolean {
        var exempted = false;
        if (!(key in types)) {
            utils.consoleLog(`actual check failed ${key}`);
            if (this.isExempted(t)) {
                exempted = true;
            } else {
                utils.throwCompatError(`${key} cannot be found.`);
            }
        }

        return exempted;
    }

    protected isExempted(t: IType): boolean {
        return (t.annotations || [])
            .some(a=> a.name === exemptedAnnotation && a.value === true);
    }
}

class ModuleChecker extends BaseChecker {
    public store(t: IModule, prefix: string): string {
        // Store module itself first
        var key = super.store(t, prefix);
        
        // Store declares inside this module
        (t.declares || []).filter(d=> !isExcluded(d))
            .forEach(d=> storeTypes(d, key));

        return key;
    }

    public check(t: IModule, prefix: string): CheckResult {
        // Check module itself first
        var checkResult = super.check(t, prefix);
        
        // Don't check declares in this module if the module is global or module is exempted 
        if (!checkResult.exempted || t.name === "_global_") {
            var declares = t.declares || [];
            utils.consoleLog(`Checking declares of ${checkResult.key} (${declares.length})`);
            declares.filter(d=> !isExcluded(d))
                .forEach(d=> checkTypes(d, checkResult.key));
        }

        return checkResult;
    }
}

checkers["module"] = new ModuleChecker();

class InterfaceChecker extends BaseChecker {
    public store(t: IInterface, prefix: string): string {
        // Store interface itself first
        var key = super.store(t, prefix);
        
        // Store signatures of the interface
        (t.signatures || []).forEach(s=> storeTypes(s, key));

        return key;
    }

    public check(t: IInterface, prefix: string): CheckResult {
        // Check interface itself first
        var checkResult = super.check(t, prefix);
        
        // Don't check signatures of this interface if interface is exempted
        if (!checkResult.exempted) {
            (t.signatures || []).forEach(s=> checkTypes(s, checkResult.key));
        }

        return checkResult;
    }
}

checkers["interface"] = new InterfaceChecker();

class EnumChecker extends BaseChecker {
    public store(t: IEnum, prefix: string): string {
        // Store enum itself first
        var key = super.store(t, prefix);
        
        // Store enum members
        (t.members || []).forEach((v: IEnumValue) => {
            var vKey = `${key}:${v.name}:${v.value}`;
            this.storeByKey(vKey, v);
        });

        return key;
    }

    public check(t: IEnum, prefix: string): CheckResult {
        // Check enum itself first
        var checkResult = super.check(t, prefix);
        
        // Don't check members of this enum if enum is exempted
        if (!checkResult.exempted) {
            (t.members || []).forEach((v: IEnumValue) => {
                var vKey = `${checkResult.key}:${v.name}:${v.value}`;
                this.checkByKey(vKey, v);
            });
        }

        return checkResult;
    }
}

checkers["enum"] = new EnumChecker();

class ClassChecker extends BaseChecker {
    public store(t: IClass, prefix: string): string {
        // Store class itself first
        var key = super.store(t, prefix);
        
        // Store class members
        (t.members || []).filter(m=> !m.private).forEach(m=> storeTypes(m, key));

        return key;
    }

    public check(t: IClass, prefix: string): CheckResult {
        // Check class itself first
        var checkResult = super.check(t, prefix);
        
        // Don't check members of this class if class is exempted
        if (!checkResult.exempted) {
            (t.members || []).filter(m=> !m.private).forEach(m=> checkTypes(m, checkResult.key));
        }

        return checkResult;
    }
}

checkers["class"] = new ClassChecker();

class PropertyChecker extends BaseChecker {
    private isFunction(t: IProperty): boolean {
        return typeof t.type === "object" && (<IType>t.type).kind === "function";
    }

    protected getId(t: IProperty): string {
        if (this.isFunction(t)) {
            return t.name;
        } else {
            return `${t.name}:${JSON.stringify(t.type) }`;
        }
    }

    public store(t: IProperty, prefix: string): string {
        // Store property itself first
        var key = super.store(t, prefix);
        
        // Store sub members if property is of type function
        if (this.isFunction(t)) {
            storeTypes(<IType>t.type, key);
        }

        return key;
    }

    public check(t: IProperty, prefix: string): CheckResult {
        // Check property itself first
        var checkResult = super.check(t, prefix);

        // Don't check if this property is exempted or property type is not function
        if (!checkResult.exempted && this.isFunction(t)) {
            checkTypes(<IType>t.type, checkResult.key);
        }

        return checkResult;
    }
}

checkers["property"] = new PropertyChecker();

class FieldChecker extends BaseChecker {
    protected getId(t: IField): string {
        return `${t.static ? "static" : "member"}:${t.name}:${JSON.stringify(t.type) }`;
    }
}

checkers["field"] = new FieldChecker();

class FunctionChecker extends BaseChecker {
    private getParamKey(p: IParameter, i: number, key: string): string {
        return `${key}:${p.optional ? "optional" : "required"}-param:${i}:${JSON.stringify(p) }`;
    }

    private getReturnsKey(t: IFunction, key: string): string {
        return `${key}:returns:${JSON.stringify(t.returns) }`;
    }

    protected getId(t: IFunction): string {
        return (t.name || "_noname_");
    }

    public store(t: IFunction, prefix: string): string {
        // Store function itself first
        var key = super.store(t, prefix);
        
        // Store function params
        (t.parameters || []).forEach((p: IParameter, i: number) => {
            var pKey = this.getParamKey(p, i, key);
            this.storeByKey(pKey, p);
        });
        
        // Store returns type
        var returnsKey = this.getReturnsKey(t, key);
        this.storeByKey(returnsKey, <any>{});

        return key;
    }

    public check(t: IFunction, prefix: string): CheckResult {
        // Check function itself first
        var checkResult = super.check(t, prefix);
        
        // Don't check the parameters if the function is exempted
        if (!checkResult.exempted) {
            (t.parameters || []).forEach((p: IParameter, i: number) => {
                var pKey = this.getParamKey(p, i, checkResult.key);
                this.checkByKey(pKey, p);
            });

            // Check returns type
            var returnsKey = this.getReturnsKey(t, checkResult.key);
            this.checkByKey(returnsKey, <any>{});
        }

        return checkResult;
    }
}

checkers["function"] = new FunctionChecker();

class MethodChecker extends FunctionChecker {
}

checkers["method"] = new MethodChecker();

class CallChecker extends FunctionChecker {
}

checkers["call"] = new CallChecker();

class ConstructorChecker extends FunctionChecker {
    protected getId(t: IFunction): string {
        return "_constructor_";
    }
}

checkers["ctor"] = new ConstructorChecker();

class IndexChecker extends BaseChecker {
    protected getId(t: IIndex): string {
        return `param:${t.parameter ? JSON.stringify(t.parameter.type) : ""}:returns:${t.returns ? JSON.stringify(t.returns) : ""}`;
    }
}

checkers["index"] = new IndexChecker();