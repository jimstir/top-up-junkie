declare module '*.json' {
  const value: {
    abi: any[];
    bytecode: string;
    [key: string]: any;
  };
  export default value;
}

declare module '../artifacts/contracts/TopAcc.sol/TopAcc.json' {
  const value: {
    abi: any[];
    bytecode: {
      object: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  export default value;
}

declare module '../artifacts/contracts/services/AddService.sol/AddService.json' {
  const value: {
    abi: any[];
    bytecode: {
      object: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  export default value;
}
