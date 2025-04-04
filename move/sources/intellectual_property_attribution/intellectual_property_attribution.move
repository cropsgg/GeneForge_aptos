module Geneforge::IntellectualPropertyAttribution {
    use std::vector;
    use std::signer;
    use aptos_framework::timestamp;

    /// Represents a single research contribution.
    struct Contribution has key, store {
        id: u64,
        contributor: address,
        description: vector<u8>,
        timestamp: u64,
    }

    /// Global registry for contributions.
    struct ContributionRegistry has key, store {
        contributions: vector<Contribution>,
        next_id: u64,
    }

    /// Initializes the contribution registry.
    public fun initialize_contribution_registry(account: &signer) {
        move_to(account, ContributionRegistry {
            contributions: vector::empty<Contribution>(),
            next_id: 0
        });
    }

    /// Records a new research contribution.
    public fun record_contribution(account: &signer, description: vector<u8>) acquires ContributionRegistry {
        let registry = borrow_global_mut<ContributionRegistry>(signer::address_of(account));
        let contribution_id = registry.next_id;
        registry.next_id = contribution_id + 1;
        let contribution = Contribution {
            id: contribution_id,
            contributor: signer::address_of(account),
            description: description,
            timestamp: timestamp::now_seconds(),
        };
        vector::push_back(&mut registry.contributions, contribution);
    }
}
