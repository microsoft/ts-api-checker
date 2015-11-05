/// <reference path="./node/node.d.ts" />
/// <reference path="./commander/commander.d.ts" />
/// <reference path="./tsreflect-compiler/tsreflect-compiler.d.ts" />

interface IType {
	kind: string;
	name: string;
	private: boolean;
    static: boolean;
}

interface IModule extends IType {
	declares: IType[];
}

interface IObject extends IType {
	signatures: IType[];
}
interface IInterface extends IObject {
}

interface IProperty extends IType {
	type: string | IType;
	optional?: boolean;
}

interface IEnumValue extends IType {
	value: number;
}

interface IEnum extends IType {
	members: IEnumValue[];
}

interface IClass extends IType {
	members: IType[];
}

interface IReference extends IType {
	type: string | IType;
	arguments: string[] | IType[];
}

interface IParameter extends IType {
	optional?: boolean;
	type: IType;
}

interface IField extends IType {
	private: boolean;
	protected: boolean;
}

interface IFunction extends IType {
	parameters: IParameter[];
	returns: string | IType;
}

interface IMethod extends IFunction {
}

interface IConstructor extends IFunction {
}

interface ICall extends IFunction {
}

interface IIndex extends IType {
	parameter: IParameter;
	returns: string | IType;
}

interface IUnion extends IType {
	types: any[];
}

interface ComparedTypes {
	[kind: string]: IType;
}
