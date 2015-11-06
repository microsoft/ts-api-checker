/// <reference path="../types/tsd" />

import utils = require("./utils");

var types: ComparedTypes = {};

var exemptedAnnotation = "exemptedapi";

interface CheckResult {
	key: string;
	exempted: boolean;
}

export function setExemptedAnnotation(annotation: string): void {
	exemptedAnnotation = annotation;
}

export function storeTypes(t: IType, prefix: string): void {
	var kind = t.kind;
	if (kind === "constructor") {
		kind = "ctor";
	}

	var checker = checkers[kind];
	if (!checker) {
		utils.throwError(`Unknown kind: ${kind}`);
	}

	checker.store(t, prefix);
}

export function checkTypes(t: IType, prefix: string): void {
	var kind = t.kind;
	if (kind === "constructor") {
		kind = "ctor";
	}

	var checker = checkers[kind];
	if (!checker) {
		utils.throwError(`Unknown kind: ${kind}`);
	}

	checker.check(t, prefix);
}


var checkers: { [kind: string]: IChecker } = {};

interface IChecker {
	store(t: IType, prefix: string): string;
	check(t: IType, prefix: string): CheckResult;
	toTypeString(t: IType): string;
}

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

	public toTypeString(t: IType): string {
		return "";
	}

	protected getKey(t: IType, prefix: string): string {
		return `${prefix || ""}/${t.static ? "static-" : ""}${t.kind}:${this.getName(t) }`;
	}

	protected getName(t: IType): string {
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
        for (var a of (t.annotations || [])) {
            if (a.name === exemptedAnnotation && a.value === true) {
                return true;
            }
        }

        return false;
	}
}

class ModuleChecker extends BaseChecker {
	public store(t: IModule, prefix: string): string {
		var key = super.store(t, prefix);
		for (var d of (t.declares || [])) {
			if (d.kind !== "variable" && d.kind !== "import") {
				storeTypes(d, key);
			}
		}

		return key;
	}

	public check(t: IModule, prefix: string): CheckResult {
		var checkResult = super.check(t, prefix);
		if (!checkResult.exempted || t.name === "_global_") {
			var declares = t.declares || [];
			utils.consoleLog(`Checking declares of ${checkResult.key} (${declares.length})`);
			for (var d of declares) {
				if (d.kind !== "variable" && d.kind !== "import") {
					checkTypes(d, checkResult.key);
				}
			}
		}

		return checkResult;
	}
}

checkers["module"] = new ModuleChecker();

class InterfaceChecker extends BaseChecker {
	public store(t: IInterface, prefix: string): string {
		var key = super.store(t, prefix);
		for (var s of (t.signatures || [])) {
			storeTypes(s, key);
		}

		return key;
	}

	public check(t: IInterface, prefix: string): CheckResult {
		var checkResult = super.check(t, prefix);
		if (!checkResult.exempted) {
			for (var s of (t.signatures || [])) {
				checkTypes(s, checkResult.key);
			}
		}

		return checkResult;
	}
}

checkers["interface"] = new InterfaceChecker();

class EnumChecker extends BaseChecker {
	public store(t: IEnum, prefix: string): string {
		var key = super.store(t, prefix);
		for (var v of (t.members || [])) {
			var vKey = `${key}:${v.name}:${v.value}`;
			this.storeByKey(vKey, v);
		}
		return key;
	}

	public check(t: IEnum, prefix: string): CheckResult {
		var checkResult = super.check(t, prefix);
		if (!checkResult.exempted) {
			for (var v of (t.members || [])) {
				var vKey = `${checkResult.key}:${v.name}:${v.value}`;
				this.checkByKey(vKey, v);
			}
		}

		return checkResult;
	}
}

checkers["enum"] = new EnumChecker();

class ClassChecker extends BaseChecker {
	public store(t: IClass, prefix: string): string {
		var key = super.store(t, prefix);
		for (var m of (t.members || [])) {
			if (!m.private) {
				storeTypes(m, key);
			}
		}

		return key;
	}

	public check(t: IClass, prefix: string): CheckResult {
		var checkResult = super.check(t, prefix);
		for (var m of (t.members || [])) {
			if (!m.private) {
				checkTypes(m, checkResult.key);
			}
		}

		return checkResult;
	}
}

checkers["class"] = new ClassChecker();

class PropertyChecker extends BaseChecker {
	private isFunction(t: IProperty): boolean {
		return typeof t.type === "object" && (<IType>t.type).kind === "function";
	}

	protected getName(t: IProperty): string {
		if (this.isFunction(t)) {
			return t.name;
		} else {
			return `${t.name}:${JSON.stringify(t.type) }`;
		}
	}

	public store(t: IProperty, prefix: string): string {
		var key = super.store(t, prefix);
		if (this.isFunction(t)) {
			storeTypes(<IType>t.type, key);
		}

		return key;
	}

	public check(t: IProperty, prefix: string): CheckResult {
		var checkResult = super.check(t, prefix);
		if (this.isFunction(t)) {
			checkTypes(<IType>t.type, checkResult.key);
		}

		return checkResult;
	}
}

checkers["property"] = new PropertyChecker();

class FieldChecker extends BaseChecker {
	protected getName(t: IField): string {
		return `${t.static ? "static" : "member"}:${t.name}:${JSON.stringify(t.type)}`;
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

	protected getName(t: IFunction): string {
		return (t.name || "_noname_");
	}

	public store(t: IFunction, prefix: string): string {
		var key = super.store(t, prefix);
		var params = t.parameters || [];
		for (var i = 0; i < params.length; i++) {
			var p = params[i];
			var pKey = this.getParamKey(p, i, key);
			this.storeByKey(pKey, p);
		}

		var returnsKey = this.getReturnsKey(t, key);
		this.storeByKey(returnsKey, <any>{});

		return key;
	}

	public check(t: IFunction, prefix: string): CheckResult {
		var checkResult = super.check(t, prefix);
		utils.consoleLog(`check function params for ${checkResult.key}`)
		if (!checkResult.exempted) {
			var params = t.parameters || [];
			for (var i = 0; i < params.length; i++) {
				var p = params[i];
				var pKey = this.getParamKey(p, i, checkResult.key);
				this.checkByKey(pKey, p);
			}

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
	protected getName(t: IFunction): string {
		return "_constructor_";
	}
}

checkers["ctor"] = new ConstructorChecker();

class IndexChecker extends BaseChecker {
	protected getName(t: IIndex): string {
		return `param:${t.parameter ? JSON.stringify(t.parameter.type) : ""}:returns:${t.returns ? JSON.stringify(t.returns) : ""}`;
	}
}

checkers["index"] = new IndexChecker();