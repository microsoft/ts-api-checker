/// <reference path="./node/node.d.ts" />
/// <reference path="./commander/commander.d.ts" />
/// <reference path="./tsreflect-compiler/tsreflect-compiler.d.ts" />

interface IType {
    kind: string;
    name: string;
    private: boolean;
    static: boolean;
    annotations?: IAnnotation[];
    exempted?: boolean;
}

interface IModule extends IType {
    declares: IType[];
}

interface IInterface extends IType {
    signatures: IType[];
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

interface IParameter extends IType {
    optional?: boolean;
    type: IType;
}

interface IField extends IType {
    type: IType;
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

interface IAlias extends IType {
    type: IType;
}

interface IAnnotation {
    name: string;
    value: any;
}

interface ComparedTypes {
    [kind: string]: IType;
}
