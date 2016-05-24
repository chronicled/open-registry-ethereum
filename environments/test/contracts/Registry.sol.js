// Factory "morphs" into a Pudding class.
// The reasoning is that calling load in each context
// is cumbersome.

(function() {

  var contract_data = {
    abi: [{"constant":true,"inputs":[{"name":"_reference","type":"bytes32"}],"name":"getRecord","outputs":[{"name":"","type":"uint256"},{"name":"","type":"string"}],"type":"function"},{"constant":true,"inputs":[],"name":"registrar","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"records","outputs":[{"name":"owner","type":"address"},{"name":"version","type":"uint256"},{"name":"data","type":"string"},{"name":"isValid","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_data","type":"string"},{"name":"_version","type":"uint256"},{"name":"_reference","type":"bytes32"},{"name":"_owner","type":"address"}],"name":"createFor","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"_data","type":"string"},{"name":"_version","type":"uint256"},{"name":"_reference","type":"bytes32"}],"name":"create","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_reference","type":"bytes32"},{"name":"_isValid","type":"bool"}],"name":"setValid","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"recordIndex","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"inputs":[],"type":"constructor"}],
    binary: "6060604052600280546001810180835590919082801582901160385760040281600402836000526020600020918201910160389190605c565b505050506108ff806100d06000396000f35b505060038101805460ff191690556001015b8082111560cc578054600160a060020a03191681556000600182810182905560028381018054848255909281161561010002600019011604601f81901060a15750604a565b601f016020900490600052602060002090810190604a91905b8082111560cc576000815560010160ba565b509056606060405236156100615760e060020a6000350463213681cd81146100635780632b20e3971461009257806334461067146100a4578063456ab4b3146101655780634617e99714610232578063815af8df14610306578063a19dffdd1461032e575b005b61034660043560408051602081810183526000808352848152600190915291822054808314156105a657610002565b6103bb600054600160a060020a031681565b6103d860043560028054829081101561000257506000526004027f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace8101547f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5acf8201547f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ad1830154600160a060020a03929092169290917f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ad0919091019060ff1684565b6100616004808035906020019082018035906020019191908080601f016020809104026020016040519081016040528093929190818152602001838380828437509496505093359350506044359150506064358033600080905080600160a060020a0316635fec5d0b84846040518360e060020a0281526004018083600160a060020a0316815260200182600160a060020a03168152602001925050506020604051808303816000876161da5a03f115610002575050604051511590506104a8576104a6848888886102e8565b6104816004808035906020019082018035906020019191908080601f01602080910402602001604051908101604052809392919081815260200183838082843750949650509335935050604435915050600033600080905080600160a060020a031663b19c1432836040518260e060020a0281526004018082600160a060020a031681526020019150506020604051808303816000876161da5a03f115610002575050604051511590506104935761049d338787875b6000818152600160205260408120548190819011156106aa57610002565b610481600435602435600082815260016020526040812054818080838114156104b157610002565b61048160043560016020526000908152604090205481565b60405180838152602001806020018281038252838181518152602001915080519060200190808383829060006004602084601f0104600f02600301f150905090810190601f1680156103ac5780820380516001836020036101000a031916815260200191505b50935050505060405180910390f35b60408051600160a060020a03929092168252519081900360200190f35b60408051600160a060020a038616815260208101859052606081018390526080918101828152845460026001821615610100026000190190911604928201839052909160a08301908590801561046f5780601f106104445761010080835404028352916020019161046f565b820191906000526020600020905b81548152906001019060200180831161045257829003601f168201915b50509550505050505060405180910390f35b60408051918252519081900360200190f35b50505b9392505050565b92505050610496565b505b50505050505050565b6002805485908110156100025760009182526004027f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace0154600160a060020a039081169450909250331683141561050757600191505b8115156105755780905080600160a060020a0316635fec5d0b84336040518360e060020a0281526004018083600160a060020a0316815260200182600160a060020a03168152602001925050506020604051808303816000876161da5a03f115610002575050604051519250505b811561059c5761059c8787600082815260016020526040812054908114156108b357610002565b5050505092915050565b600280548290811015610002575080546000829052600483027f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5acf015491908390811015610002575060408051600485027f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ad001805460206001821615610100026000190190911694909404601f810185900485028301850190935282825292909183918301828280156106995780601f1061066e57610100808354040283529160200191610699565b820191906000526020600020905b81548152906001019060200180831161067c57829003601f168201915b505050505090509250925050915091565b60028054600181018083559091908280158290116106e1576004028160040283600052602060002091820191016106e191906107c8565b5050509050608060405190810160405280878152602001858152602001868152602001600181526020015060026000508281548110156100025790600052602060002090600402016000508151815473ffffffffffffffffffffffffffffffffffffffff19161781556020828101516001838101919091556040840151805160028581018054600082815287902091969581161561010002600019011691909104601f90810185900482019492939192919091019083901061084f57805160ff19168380011785555b5061087f929150610837565b505060038101805460ff191690556001015b8082111561084b57805473ffffffffffffffffffffffffffffffffffffffff191681556000600182810182905560028381018054848255909281161561010002600019011604601f81901061081d57506107b6565b601f0160209004906000526020600020908101906107b691905b8082111561084b5760008155600101610837565b5090565b828001600101855582156107aa579182015b828111156107aa578251826000505591602001919060010190610861565b505060609190910151600391909101805460ff19169091179055600092835260016020526040909220829055509392505050565b816002600050828154811015610002576000919091526004027f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ad101805460ff191691909117905550505056",
    unlinked_binary: "6060604052600280546001810180835590919082801582901160385760040281600402836000526020600020918201910160389190605c565b505050506108ff806100d06000396000f35b505060038101805460ff191690556001015b8082111560cc578054600160a060020a03191681556000600182810182905560028381018054848255909281161561010002600019011604601f81901060a15750604a565b601f016020900490600052602060002090810190604a91905b8082111560cc576000815560010160ba565b509056606060405236156100615760e060020a6000350463213681cd81146100635780632b20e3971461009257806334461067146100a4578063456ab4b3146101655780634617e99714610232578063815af8df14610306578063a19dffdd1461032e575b005b61034660043560408051602081810183526000808352848152600190915291822054808314156105a657610002565b6103bb600054600160a060020a031681565b6103d860043560028054829081101561000257506000526004027f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace8101547f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5acf8201547f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ad1830154600160a060020a03929092169290917f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ad0919091019060ff1684565b6100616004808035906020019082018035906020019191908080601f016020809104026020016040519081016040528093929190818152602001838380828437509496505093359350506044359150506064358033600080905080600160a060020a0316635fec5d0b84846040518360e060020a0281526004018083600160a060020a0316815260200182600160a060020a03168152602001925050506020604051808303816000876161da5a03f115610002575050604051511590506104a8576104a6848888886102e8565b6104816004808035906020019082018035906020019191908080601f01602080910402602001604051908101604052809392919081815260200183838082843750949650509335935050604435915050600033600080905080600160a060020a031663b19c1432836040518260e060020a0281526004018082600160a060020a031681526020019150506020604051808303816000876161da5a03f115610002575050604051511590506104935761049d338787875b6000818152600160205260408120548190819011156106aa57610002565b610481600435602435600082815260016020526040812054818080838114156104b157610002565b61048160043560016020526000908152604090205481565b60405180838152602001806020018281038252838181518152602001915080519060200190808383829060006004602084601f0104600f02600301f150905090810190601f1680156103ac5780820380516001836020036101000a031916815260200191505b50935050505060405180910390f35b60408051600160a060020a03929092168252519081900360200190f35b60408051600160a060020a038616815260208101859052606081018390526080918101828152845460026001821615610100026000190190911604928201839052909160a08301908590801561046f5780601f106104445761010080835404028352916020019161046f565b820191906000526020600020905b81548152906001019060200180831161045257829003601f168201915b50509550505050505060405180910390f35b60408051918252519081900360200190f35b50505b9392505050565b92505050610496565b505b50505050505050565b6002805485908110156100025760009182526004027f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace0154600160a060020a039081169450909250331683141561050757600191505b8115156105755780905080600160a060020a0316635fec5d0b84336040518360e060020a0281526004018083600160a060020a0316815260200182600160a060020a03168152602001925050506020604051808303816000876161da5a03f115610002575050604051519250505b811561059c5761059c8787600082815260016020526040812054908114156108b357610002565b5050505092915050565b600280548290811015610002575080546000829052600483027f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5acf015491908390811015610002575060408051600485027f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ad001805460206001821615610100026000190190911694909404601f810185900485028301850190935282825292909183918301828280156106995780601f1061066e57610100808354040283529160200191610699565b820191906000526020600020905b81548152906001019060200180831161067c57829003601f168201915b505050505090509250925050915091565b60028054600181018083559091908280158290116106e1576004028160040283600052602060002091820191016106e191906107c8565b5050509050608060405190810160405280878152602001858152602001868152602001600181526020015060026000508281548110156100025790600052602060002090600402016000508151815473ffffffffffffffffffffffffffffffffffffffff19161781556020828101516001838101919091556040840151805160028581018054600082815287902091969581161561010002600019011691909104601f90810185900482019492939192919091019083901061084f57805160ff19168380011785555b5061087f929150610837565b505060038101805460ff191690556001015b8082111561084b57805473ffffffffffffffffffffffffffffffffffffffff191681556000600182810182905560028381018054848255909281161561010002600019011604601f81901061081d57506107b6565b601f0160209004906000526020600020908101906107b691905b8082111561084b5760008155600101610837565b5090565b828001600101855582156107aa579182015b828111156107aa578251826000505591602001919060010190610861565b505060609190910151600391909101805460ff19169091179055600092835260016020526040909220829055509392505050565b816002600050828154811015610002576000919091526004027f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ad101805460ff191691909117905550505056",
    address: "0x455fc907f87c4a9ffb22eb9cddfa00a1ddbaddb5",
    generated_with: "2.0.6",
    contract_name: "Registry"
  };

  function Contract() {
    if (Contract.Pudding == null) {
      throw new Error("Registry error: Please call load() first before creating new instance of this contract.");
    }

    Contract.Pudding.apply(this, arguments);
  };

  Contract.load = function(Pudding) {
    Contract.Pudding = Pudding;

    Pudding.whisk(contract_data, Contract);

    // Return itself for backwards compatibility.
    return Contract;
  }

  Contract.new = function() {
    if (Contract.Pudding == null) {
      throw new Error("Registry error: Please call load() first before calling new().");
    }

    return Contract.Pudding.new.apply(Contract, arguments);
  };

  Contract.at = function() {
    if (Contract.Pudding == null) {
      throw new Error("Registry error: lease call load() first before calling at().");
    }

    return Contract.Pudding.at.apply(Contract, arguments);
  };

  Contract.deployed = function() {
    if (Contract.Pudding == null) {
      throw new Error("Registry error: Please call load() first before calling deployed().");
    }

    return Contract.Pudding.deployed.apply(Contract, arguments);
  };

  if (typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = Contract;
  } else {
    // There will only be one version of Pudding in the browser,
    // and we can use that.
    window.Registry = Contract;
  }

})();
