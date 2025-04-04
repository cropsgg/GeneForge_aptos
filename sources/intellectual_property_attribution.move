module Geneforge::IntellectualPropertyAttribution {
    use std::vector;
    use std::signer;
    use aptos_framework::timestamp;

    /// Resource representing an IP contribution.
    struct IPContribution has key, store {
        id: u64,
        owner: address,
        title: vector<u8>,
        description: vector<u8>,
        content_hash: vector<u8>,
        timestamp: u64,
    }

    /// Global registry for IP contributions.
    struct IPRegistry has key, store {
        contributions: vector<IPContribution>,
        next_id: u64,
    }

    /// Initializes the IP registry.
    public entry fun initialize_ip_registry(account: &signer) {
        move_to(account, IPRegistry {
            contributions: vector::empty<IPContribution>(),
            next_id: 0
        });
    }

    /// Registers a new IP contribution.
    public entry fun register_contribution(
        account: &signer, 
        title: vector<u8>,
        description: vector<u8>,
        content_hash: vector<u8>
    ) acquires IPRegistry {
        let registry = borrow_global_mut<IPRegistry>(signer::address_of(account));
        let id = registry.next_id;
        registry.next_id = id + 1;
        
        let contribution = IPContribution {
            id,
            owner: signer::address_of(account),
            title,
            description,
            content_hash,
            timestamp: timestamp::now_seconds(),
        };
        
        vector::push_back(&mut registry.contributions, contribution);
    }
}
