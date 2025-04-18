module Geneforge::ExperimentalDataAuditTrail {
    use std::vector;
    use std::signer;
    use aptos_framework::timestamp;

    /// Error codes
    const EXPERIMENT_NOT_FOUND: u64 = 1;
    const REGISTRY_NOT_INITIALIZED: u64 = 2;

    /// Record for audit events in an experiment.
    struct HistoryRecord has copy, drop, store {
        event: vector<u8>, // e.g., "Submitted", "Updated"
        operator: address,
        timestamp: u64,
    }

    /// Resource representing an experimental dataset.
    struct ExperimentData has key, store {
        id: u64,
        owner: address,
        data_hash: vector<u8>, // User-computed hash of the dataset.
        version: u64,
        history: vector<HistoryRecord>,
    }

    /// Global registry for experimental datasets.
    struct DataRegistry has key, store {
        experiments: vector<ExperimentData>,
        next_id: u64,
    }

    /// Initializes the experimental data registry.
    public entry fun initialize_data_registry(account: &signer) {
        move_to(account, DataRegistry {
            experiments: vector::empty<ExperimentData>(),
            next_id: 0
        });
    }

    /// Submits a new experimental dataset.
    public entry fun submit_experiment(account: &signer, data_hash: vector<u8>) acquires DataRegistry {
        let registry = borrow_global_mut<DataRegistry>(signer::address_of(account));
        let experiment_id = registry.next_id;
        registry.next_id = experiment_id + 1;

        let initial_record = HistoryRecord {
            event: b"Submitted",
            operator: signer::address_of(account),
            timestamp: timestamp::now_seconds(),
        };

        let exp_data = ExperimentData {
            id: experiment_id,
            owner: signer::address_of(account),
            data_hash: data_hash,
            version: 1,
            history: vector::singleton(initial_record),
        };

        vector::push_back(&mut registry.experiments, exp_data);
    }

    /// Updates an existing experimental dataset record.
    public entry fun update_experiment(account: &signer, experiment_id: u64, new_data_hash: vector<u8>) acquires DataRegistry {
        let registry = borrow_global_mut<DataRegistry>(signer::address_of(account));
        let exp_data = find_experiment_mut(&mut registry.experiments, experiment_id);
        // Only the owner can update the experiment record.
        assert!(exp_data.owner == signer::address_of(account), 1);
        exp_data.version = exp_data.version + 1;
        exp_data.data_hash = new_data_hash;
        let update_record = HistoryRecord {
            event: b"Updated",
            operator: signer::address_of(account),
            timestamp: timestamp::now_seconds(),
        };
        vector::push_back(&mut exp_data.history, update_record);
    }

    /// Internal helper function to find a mutable experimental record.
    fun find_experiment_mut(experiments: &mut vector<ExperimentData>, experiment_id: u64): &mut ExperimentData {
        let len = vector::length(experiments);
        let i = 0;
        while (i < len) {
            let exp_ref = vector::borrow_mut(experiments, i);
            if (exp_ref.id == experiment_id) {
                return exp_ref
            };
            i = i + 1;
        };
        assert!(false, EXPERIMENT_NOT_FOUND);
        vector::borrow_mut(experiments, 0) // This line will never execute, but is needed for the compiler
    }
    
    /// Get experiment data by ID (read-only)
    public fun get_experiment_by_id(registry_address: address, experiment_id: u64): (vector<u8>, address, u64, u64) acquires DataRegistry {
        assert!(exists<DataRegistry>(registry_address), REGISTRY_NOT_INITIALIZED);
        let registry = borrow_global<DataRegistry>(registry_address);
        
        let len = vector::length(&registry.experiments);
        let i = 0;
        while (i < len) {
            let experiment = vector::borrow(&registry.experiments, i);
            if (experiment.id == experiment_id) {
                let history_len = vector::length(&experiment.history);
                let latest_timestamp = 0;
                if (history_len > 0) {
                    let latest_record = vector::borrow(&experiment.history, history_len - 1);
                    latest_timestamp = latest_record.timestamp;
                };
                
                return (experiment.data_hash, experiment.owner, experiment.version, latest_timestamp)
            };
            i = i + 1;
        };
        
        assert!(false, EXPERIMENT_NOT_FOUND);
        (b"", @0x0, 0, 0) // This line will never execute, but is needed for the compiler
    }
    
    /// Get count of experiments in the registry
    public fun get_experiment_count(registry_address: address): u64 acquires DataRegistry {
        if (!exists<DataRegistry>(registry_address)) {
            return 0
        };
        
        let registry = borrow_global<DataRegistry>(registry_address);
        vector::length(&registry.experiments)
    }
}
