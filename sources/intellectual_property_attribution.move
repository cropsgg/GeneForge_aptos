module Geneforge::IntellectualPropertyAttribution {
    use std::vector;
    use std::signer;
    use aptos_framework::timestamp;

    /// Error codes
    const IP_NOT_FOUND: u64 = 1;
    const REGISTRY_NOT_INITIALIZED: u64 = 2;

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
    
    /// Get IP contribution details by ID (read-only)
    public fun get_contribution_by_id(registry_address: address, contribution_id: u64): (vector<u8>, vector<u8>, vector<u8>, address, u64) acquires IPRegistry {
        assert!(exists<IPRegistry>(registry_address), REGISTRY_NOT_INITIALIZED);
        let registry = borrow_global<IPRegistry>(registry_address);
        
        let len = vector::length(&registry.contributions);
        let i = 0;
        while (i < len) {
            let contribution = vector::borrow(&registry.contributions, i);
            if (contribution.id == contribution_id) {
                return (
                    contribution.title,
                    contribution.description,
                    contribution.content_hash,
                    contribution.owner,
                    contribution.timestamp
                )
            };
            i = i + 1;
        };
        
        assert!(false, IP_NOT_FOUND);
        (b"", b"", b"", @0x0, 0) // This line will never execute but is needed for the compiler
    }
    
    /// Get count of IP contributions in the registry
    public fun get_contribution_count(registry_address: address): u64 acquires IPRegistry {
        if (!exists<IPRegistry>(registry_address)) {
            return 0
        };
        
        let registry = borrow_global<IPRegistry>(registry_address);
        vector::length(&registry.contributions)
    }
    
    /// Get count of IP contributions by owner
    public fun get_owner_contribution_count(registry_address: address, owner: address): u64 acquires IPRegistry {
        assert!(exists<IPRegistry>(registry_address), REGISTRY_NOT_INITIALIZED);
        let registry = borrow_global<IPRegistry>(registry_address);
        let len = vector::length(&registry.contributions);
        let count = 0;
        let i = 0;
        
        while (i < len) {
            let contribution = vector::borrow(&registry.contributions, i);
            if (contribution.owner == owner) {
                count = count + 1;
            };
            i = i + 1;
        };
        
        count
    }
}
