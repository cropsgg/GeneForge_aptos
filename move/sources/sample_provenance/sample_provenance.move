module Geneforge::SampleProvenance {
    use std::vector;
    use std::signer;
    use aptos_framework::timestamp;

    /// Resource representing a history event for a sample.
    struct HistoryEvent has copy, drop, store {
        event_type: vector<u8>, // e.g., "Registered", "Transferred"
        operator: address,
        timestamp: u64,
        details: vector<u8>,
    }

    /// Resource representing a single sample and its provenance history.
    struct Sample has key, store {
        id: u64,
        description: vector<u8>,
        owner: address,
        history: vector<HistoryEvent>,
    }

    /// Global registry for samples. Stored under the deployer's account.
    struct SampleRegistry has key, store {
        samples: vector<Sample>,
        next_id: u64,
    }

    /// Initializes the sample registry.
    public fun initialize_registry(account: &signer) {
        move_to(account, SampleRegistry {
            samples: vector::empty<Sample>(),
            next_id: 0
        });
    }

    /// Registers a new sample.
    /// The user must later add the detailed smart contract logic if desired.
    public fun register_sample(account: &signer, description: vector<u8>) acquires SampleRegistry {
        let registry = borrow_global_mut<SampleRegistry>(signer::address_of(account));
        let sample_id = registry.next_id;
        registry.next_id = sample_id + 1;

        let initial_event = HistoryEvent {
            event_type: b"Registered".to_vec(),
            operator: signer::address_of(account),
            timestamp: timestamp::now_seconds(),
            details: description,
        };

        let sample = Sample {
            id: sample_id,
            description: b"Sample registered".to_vec(), // Placeholder text; edit as needed.
            owner: signer::address_of(account),
            history: vector::singleton(initial_event),
        };
        vector::push_back(&mut registry.samples, sample);
    }

    /// Records a transfer event for a given sample.
    public fun record_transfer(account: &signer, sample_id: u64, new_owner: address, details: vector<u8>) acquires SampleRegistry {
        let registry = borrow_global_mut<SampleRegistry>(signer::address_of(account));
        let sample_ref = find_sample_mut(&mut registry.samples, sample_id);
        // Only the current owner can record a transfer.
        assert!(sample_ref.owner == signer::address_of(account), 1);
        let transfer_event = HistoryEvent {
            event_type: b"Transferred".to_vec(),
            operator: signer::address_of(account),
            timestamp: timestamp::now_seconds(),
            details: details,
        };
        vector::push_back(&mut sample_ref.history, transfer_event);
        sample_ref.owner = new_owner;
    }

    /// Internal helper function to find a mutable sample by id.
    fun find_sample_mut(samples: &mut vector<Sample>, sample_id: u64): &mut Sample {
        let len = vector::length(samples);
        let mut i = 0;
        while (i < len) {
            let sample_ref = vector::borrow_mut(samples, i);
            if (sample_ref.id == sample_id) {
                return sample_ref;
            };
            i = i + 1;
        };
        abort 2;
    }
}
