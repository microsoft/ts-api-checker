/// <reference path="../types/tsd" />

import utils = require("./utils");

var types: ComparedTypes = {};

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
	check(t: IType, prefix: string): string;
	toTypeString(t: IType): string;
}

class BaseChecker implements IChecker {
	public store(t: IType, prefix: string): string {
		var key = this.getKey(t, prefix);
		types[key] = t;

		utils.consoleLog(key);

		return key;
	}

	public check(t: IType, prefix: string): string {
		var key = this.getKey(t, prefix);
		types[key] = t;

		utils.consoleLog(key);

		return key;
	}

	public toTypeString(t: IType): string {
		return "";
	}

	protected getKey(t: IType, prefix: string): string {
		return `${prefix || ""}:${t.static ? "static-" : ""}${t.kind}:${this.getName(t) }`;
	}

	protected getName(t: IType): string {
		return t.name;
	}
}

class ModuleChecker extends BaseChecker {
	public store(t: IModule, prefix: string): string {
		var key = super.store(t, prefix);
		for (var d of t.declares) {
			if (d.kind !== "variable" && d.kind !== "import") {
				storeTypes(d, key);
			}
		}

		return key;
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
}

checkers["interface"] = new InterfaceChecker();

class ObjectChecker extends BaseChecker {
	protected getName(t: IType): string {
		return "";
	}
}

checkers["object"] = new ObjectChecker();

class EnumChecker extends BaseChecker {
	public store(t: IEnum, prefix: string): string {
		var key = super.store(t, prefix);
		for (var v of (t.members || [])) {
			var vKey = `${key}:${v.name}`;
			utils.consoleLog(vKey);
			types[vKey] = v;
		}
		return key;
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
}

checkers["class"] = new ClassChecker();

class PropertyChecker extends BaseChecker {
	public store(t: IProperty, prefix: string): string {
		var key = super.store(t, prefix);
		if (typeof t.type === "object") {
			storeTypes(<IType>t.type, key);
		}

		return key;
	}
}

checkers["property"] = new PropertyChecker();

class ArrayChecker extends BaseChecker {
	protected getName(t: IType): string {
		return "";
	}
}

checkers["array"] = new ArrayChecker();

class FieldChecker extends BaseChecker {
	protected getName(t: IField): string {
		return `${t.static ? "static" : "member"}:${t.name}`;
	}
}

checkers["field"] = new FieldChecker();

class UnionChecker extends BaseChecker {
	protected getName(t: IType): string {
		return "";
	}
}

checkers["union"] = new UnionChecker();

class ReferenceChecker extends BaseChecker {
	protected getName(t: IType): string {
		return "";
	}

	public store(t: IProperty, prefix: string): string {
		var key = super.store(t, prefix);
		if (typeof t.type === "object") {
			storeTypes(<IType>t.type, key);
		}

		return key;
	}
}

checkers["reference"] = new ReferenceChecker();

class FunctionChecker extends BaseChecker {
	protected getName(t: IFunction): string {
		return t.name || "";
	}

	public store(t: IFunction, prefix: string): string {
		var key = super.store(t, prefix);
		var params = t.parameters || [];
		for (var i = 0; i < params.length; i++) {
			var pKey = `${key}:param:${i}`;
			utils.consoleLog(pKey);
			types[pKey] = params[i];
		}

		return key;
	}
}

checkers["function"] = new FunctionChecker();

class MethodChecker extends FunctionChecker {
}

checkers["method"] = new MethodChecker();

class CallChecker extends BaseChecker {
	public toTypeString(t: ICall): string {
		var params = t.parameters || [];
		return params.map(p=> JSON.stringify(p.type)).join(",") + ":" + JSON.stringify(t.returns);
	}

	protected getName(t: ICall): string {
		return this.toTypeString(t);
	}
}

checkers["call"] = new CallChecker();

class ConstructorChecker extends CallChecker {
}

checkers["ctor"] = new ConstructorChecker();

class IndexChecker extends BaseChecker {
	protected getName(t: IType): string {
		return "";
	}
}

checkers["index"] = new IndexChecker();