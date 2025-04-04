module Geneforge::AccessControlPermission {
    use std::vector;
    use std::signer;
    use aptos_framework::timestamp;

    /// A record representing a permission event for a resource.
    struct PermissionRecord has copy, drop, store {
        resource_id: u64,
        user: address,
        granted: bool,
        timestamp: u64,
    }

    /// Global registry for permission records.
    struct PermissionRegistry has key, store {
        permissions: vector<PermissionRecord>,
    }

    /// Initializes the permission registry.
    public fun initialize_permissions(account: &signer) {
        move_to(account, PermissionRegistry {
            permissions: vector::empty<PermissionRecord>()
        });
    }

    /// Grants permission for a specific resource.
    public fun grant_permission(account: &signer, resource_id: u64, user: address) acquires PermissionRegistry {
        let registry = borrow_global_mut<PermissionRegistry>(signer::address_of(account));
        let record = PermissionRecord {
            resource_id: resource_id,
            user: user,
            granted: true,
            timestamp: timestamp::now_seconds(),
        };
        vector::push_back(&mut registry.permissions, record);
    }

    /// Revokes permission for a specific resource.
    public fun revoke_permission(account: &signer, resource_id: u64, user: address) acquires PermissionRegistry {
        let registry = borrow_global_mut<PermissionRegistry>(signer::address_of(account));
        let record = PermissionRecord {
            resource_id: resource_id,
            user: user,
            granted: false,
            timestamp: timestamp::now_seconds(),
        };
        vector::push_back(&mut registry.permissions, record);
    }

    /// Checks if permission is granted.
    public fun is_permission_granted(registry_address: address, resource_id: u64, user: address) acquires PermissionRegistry: bool {
        let registry = borrow_global<PermissionRegistry>(registry_address);
        let len = vector::length(&registry.permissions);
        let mut allowed = false;
        let mut i = 0;
        while (i < len) {
            let rec = vector::borrow(&registry.permissions, i);
            if (rec.resource_id == resource_id && rec.user == user) {
                allowed = rec.granted;
            };
            i = i + 1;
        };
        allowed
    }
}
