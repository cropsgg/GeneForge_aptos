module Geneforge::AccessControlPermission {
    use std::vector;
    use std::signer;
    use aptos_framework::timestamp;

    /// Permission level type.
    struct PermissionLevel has copy, drop, store {
        level: u8, // 0 = none, 1 = read, 2 = write, 3 = admin
    }

    /// Resource permission for a specific user.
    struct UserPermission has copy, drop, store {
        user: address,
        resource_id: u64,
        level: PermissionLevel,
        granted_at: u64,
        granted_by: address,
    }

    /// Global registry for permissions.
    struct PermissionRegistry has key, store {
        permissions: vector<UserPermission>,
    }

    /// Initializes the permission registry.
    public entry fun initialize_permission_registry(account: &signer) {
        move_to(account, PermissionRegistry {
            permissions: vector::empty<UserPermission>(),
        });
    }

    /// Grants permission to a user.
    public entry fun grant_permission(
        account: &signer,
        user: address,
        resource_id: u64,
        level: u8
    ) acquires PermissionRegistry {
        let account_addr = signer::address_of(account);
        let registry = borrow_global_mut<PermissionRegistry>(account_addr);
        
        // Create the permission
        let permission = UserPermission {
            user,
            resource_id,
            level: PermissionLevel { level },
            granted_at: timestamp::now_seconds(),
            granted_by: account_addr,
        };
        
        vector::push_back(&mut registry.permissions, permission);
    }

    /// Checks if a user has permission for a resource.
    public fun is_permission_granted(registry_address: address, resource_id: u64, user: address): bool acquires PermissionRegistry {
        let registry = borrow_global<PermissionRegistry>(registry_address);
        let len = vector::length(&registry.permissions);
        let i = 0;
        while (i < len) {
            let permission = vector::borrow(&registry.permissions, i);
            if (permission.user == user && permission.resource_id == resource_id) {
                return true
            };
            i = i + 1;
        };
        false
    }

    /// Gets the permission level of a user for a resource.
    public fun get_permission_level(registry_address: address, resource_id: u64, user: address): u8 acquires PermissionRegistry {
        let registry = borrow_global<PermissionRegistry>(registry_address);
        let len = vector::length(&registry.permissions);
        let i = 0;
        while (i < len) {
            let permission = vector::borrow(&registry.permissions, i);
            if (permission.user == user && permission.resource_id == resource_id) {
                return permission.level.level
            };
            i = i + 1;
        };
        0 // No permission
    }
}
