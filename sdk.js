const { ethers } = require("ethers");

class ExecutionEngineSDK {
    /**
     * @param {string} rpcUrl
     * @param {string} privateKey
     * @param {string} engineAddress
     */
    constructor(rpcUrl, privateKey, engineAddress) {
        if (!rpcUrl || !privateKey || !engineAddress) {
            throw new Error("Missing required arguments: rpcUrl, privateKey, engineAddress");
        }
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.engineAddress = engineAddress;

        const engineAbi = [
            "function registry() view returns (address)",
            "function slippageGuard() view returns (address)",
            "function regimeGate() view returns (address)",
            "function checkTx(address target, bytes calldata data, uint256 value) external view returns (bool)",
            "function executeTx(address target, bytes calldata data, uint256 value) external payable returns (bytes memory)"
        ];
        this.engine = new ethers.Contract(engineAddress, engineAbi, this.wallet);
        this.regimeGateContract = null;
    }

    /**
     * Initialize connected gate contracts dynamically
     */
    async init() {
        if (this.regimeGateContract) return;
        const regimeGateAddr = await this.engine.regimeGate();
        const gateAbi = [
            "function currentRegime() view returns (uint8)",
            "function setMarketRegime(uint8 _regime) external"
        ];
        this.regimeGateContract = new ethers.Contract(regimeGateAddr, gateAbi, this.wallet);
    }

    /**
     * Query current market regime
     * @returns {Promise<number>} 0 = NORMAL, 1 = VOLATILE, 2 = PANIC
     */
    async getMarketRegime() {
        await this.init();
        const regime = await this.regimeGateContract.currentRegime();
        return Number(regime);
    }

    /**
     * Update market regime (Owner only)
     * @param {number} regime 0 = NORMAL, 1 = VOLATILE, 2 = PANIC
     */
    async setMarketRegime(regime) {
        await this.init();
        const tx = await this.regimeGateContract.setMarketRegime(regime);
        return await tx.wait();
    }

    /**
     * Parse and diagnose revert reasons to output actionable advice
     */
    diagnoseRevert(errorMsg, target) {
        if (errorMsg.includes("panic regime active")) {
            return new Error(`❌ [RevertDiagnose] PANIC REGIME ACTIVE: All transactions are globally halted by the security middleware. Action: Suspend outbound calls. Wait for market state recovery.`);
        }
        if (errorMsg.includes("volatile regime restricts")) {
            return new Error(`❌ [RevertDiagnose] VOLATILE REGIME RESTRICTIONS: Interaction with target ${target} was blocked because it is not whitelisted. Action: Request ProtocolRegistry owner to verify target address or wait for regime downgrade.`);
        }
        if (errorMsg.includes("blacklisted")) {
            return new Error(`❌ [RevertDiagnose] REGISTRY BLACKLIST: Target contract ${target} is explicitly blacklisted. Action: Execution blocked to prevent wallet assets drain.`);
        }
        return new Error(`On-chain validation failed: ${errorMsg}`);
    }

    /**
     * Check if target address is safe (incorporating GoPlus Security Address API checking)
     * @param {string} target
     * @returns {Promise<{isContract: boolean, isBlacklisted: boolean, goPlusFlagged: boolean}>}
     */
    async checkTargetSafety(target) {
        const code = await this.provider.getCode(target);
        const isContract = code !== "0x";
        
        let isBlacklisted = false;
        let goPlusFlagged = false;

        // 1. Local Contract Blacklist check
        try {
            await this.engine.checkTx(target, "0x", 0);
        } catch (err) {
            if (err.message.includes("blacklisted")) {
                isBlacklisted = true;
            }
        }

        // 2. GoPlus API Live security audit integration
        try {
            const chainId = (await this.provider.getNetwork()).chainId.toString();
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(
                `https://api.gopluslabs.io/api/v1/address_security/${target}?chain_id=${chainId}`,
                { signal: controller.signal }
            );
            clearTimeout(timeout);
            const data = await res.json();
            if (data && data.result && data.result[target.toLowerCase()]) {
                const securityData = data.result[target.toLowerCase()];
                // GoPlus malicious indicators: cybercrime, phishing, malicious_contract
                if (
                    securityData.phishing_activities === "1" || 
                    securityData.blacklisted === "1" || 
                    securityData.cybercrime === "1"
                ) {
                    goPlusFlagged = true;
                }
            }
        } catch (e) {
            // Fallback to local checks silently if GoPlus endpoint is rate-limited, offline, or timed out
        }

        return { 
            isContract, 
            isBlacklisted: isBlacklisted || goPlusFlagged,
            goPlusFlagged 
        };
    }

    /**
     * Validate transaction via checkTx view function with diagnostics decorator
     */
    async validateOnChain(target, data = "0x", value = 0n) {
        try {
            await this.engine.checkTx(target, data, value);
            return true;
        } catch (err) {
            throw this.diagnoseRevert(err.message, target);
        }
    }

    /**
     * Dry-run local simulation
     */
    async simulatePreview(target, data = "0x", value = 0n) {
        try {
            await this.provider.call({
                from: this.wallet.address,
                to: target,
                data: data,
                value: value
            });
            return true;
        } catch (err) {
            throw new Error(`TxPreview simulation failed: ${err.message}`);
        }
    }

    /**
     * Get dynamic gas settings
     */
    async getOptimizedGasFees() {
        const feeData = await this.provider.getFeeData();
        return {
            maxFeePerGas: feeData.maxFeePerGas ? feeData.maxFeePerGas * 12n / 10n : feeData.gasPrice * 12n / 10n,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas * 12n / 10n : ethers.parseUnits("1.5", "gwei")
        };
    }

    /**
     * Run all checks and execute safely
     */
    async safeExecute(target, data = "0x", value = 0n, options = {}) {
        const val = typeof value === "string" ? ethers.parseEther(value) : BigInt(value);

        // 1. Target check
        const { isBlacklisted } = await this.checkTargetSafety(target);
        if (isBlacklisted) {
            throw this.diagnoseRevert("blacklisted", target);
        }

        // 2. On-chain validation
        await this.validateOnChain(target, data, val);

        // 3. TxPreview simulation
        await this.simulatePreview(target, data, val);

        // 4. Gas fee optimization
        const gasFees = await this.getOptimizedGasFees();

        // 5. Estimate gas limit
        let gasLimit = options.gasLimit;
        if (!gasLimit) {
            try {
                const estimated = await this.engine.executeTx.estimateGas(target, data, val);
                gasLimit = estimated * 12n / 10n;
            } catch (err) {
                gasLimit = 300000n;
            }
        }

        // 6. Execute transaction
        try {
            const tx = await this.engine.executeTx(target, data, val, {
                gasLimit,
                maxFeePerGas: gasFees.maxFeePerGas,
                maxPriorityFeePerGas: gasFees.maxPriorityFeePerGas,
                ...options
            });
            return await tx.wait();
        } catch (execErr) {
            throw this.diagnoseRevert(execErr.message, target);
        }
    }
}

module.exports = ExecutionEngineSDK;
