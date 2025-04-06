module Geneforge::WorkflowAutomationCompliance {
    use std::vector;
    use std::signer;
    use aptos_framework::timestamp;

    /// Error codes
    const TASK_NOT_FOUND: u64 = 1;
    const REGISTRY_NOT_INITIALIZED: u64 = 2;

    /// Status of a workflow task.
    struct WorkflowStatus has copy, drop, store {
        status: vector<u8>, // e.g., "Pending", "Approved", "Rejected"
        operator: address,
        timestamp: u64,
    }

    /// Resource representing a workflow task.
    struct WorkflowTask has key, store {
        id: u64,
        owner: address,
        description: vector<u8>,
        status_history: vector<WorkflowStatus>,
    }

    /// Global registry for workflow tasks.
    struct WorkflowRegistry has key, store {
        tasks: vector<WorkflowTask>,
        next_task_id: u64,
    }

    /// Initializes the workflow registry.
    public entry fun initialize_workflow_registry(account: &signer) {
        move_to(account, WorkflowRegistry {
            tasks: vector::empty<WorkflowTask>(),
            next_task_id: 0
        });
    }

    /// Creates a new workflow task.
    public entry fun create_task(account: &signer, description: vector<u8>) acquires WorkflowRegistry {
        let registry = borrow_global_mut<WorkflowRegistry>(signer::address_of(account));
        let task_id = registry.next_task_id;
        registry.next_task_id = task_id + 1;

        let initial_status = WorkflowStatus {
            status: b"Pending",
            operator: signer::address_of(account),
            timestamp: timestamp::now_seconds(),
        };

        let task = WorkflowTask {
            id: task_id,
            owner: signer::address_of(account),
            description: description,
            status_history: vector::singleton(initial_status),
        };

        vector::push_back(&mut registry.tasks, task);
    }

    /// Updates the status of a workflow task.
    public entry fun update_task_status(account: &signer, task_id: u64, new_status: vector<u8>) acquires WorkflowRegistry {
        let registry = borrow_global_mut<WorkflowRegistry>(signer::address_of(account));
        let task_ref = find_task_mut(&mut registry.tasks, task_id);
        
        let status_update = WorkflowStatus {
            status: new_status,
            operator: signer::address_of(account),
            timestamp: timestamp::now_seconds(),
        };
        
        vector::push_back(&mut task_ref.status_history, status_update);
    }
    
    /// Internal helper function to find a mutable task by id.
    fun find_task_mut(tasks: &mut vector<WorkflowTask>, task_id: u64): &mut WorkflowTask {
        let len = vector::length(tasks);
        let i = 0;
        while (i < len) {
            let task_ref = vector::borrow_mut(tasks, i);
            if (task_ref.id == task_id) {
                return task_ref
            };
            i = i + 1;
        };
        assert!(false, TASK_NOT_FOUND);
        vector::borrow_mut(tasks, 0) // This line will never execute but is needed for the compiler
    }
    
    /// Get task details by ID (read-only)
    public fun get_task_by_id(registry_address: address, task_id: u64): (vector<u8>, address, vector<u8>, u64) acquires WorkflowRegistry {
        assert!(exists<WorkflowRegistry>(registry_address), REGISTRY_NOT_INITIALIZED);
        let registry = borrow_global<WorkflowRegistry>(registry_address);
        
        let len = vector::length(&registry.tasks);
        let i = 0;
        while (i < len) {
            let task = vector::borrow(&registry.tasks, i);
            if (task.id == task_id) {
                let history_len = vector::length(&task.status_history);
                let current_status = b"";
                let latest_timestamp = 0;
                
                if (history_len > 0) {
                    let latest_status = vector::borrow(&task.status_history, history_len - 1);
                    current_status = latest_status.status;
                    latest_timestamp = latest_status.timestamp;
                };
                
                return (task.description, task.owner, current_status, latest_timestamp)
            };
            i = i + 1;
        };
        
        assert!(false, TASK_NOT_FOUND);
        (b"", @0x0, b"", 0) // This line will never execute but is needed for the compiler
    }
    
    /// Get count of workflow tasks in the registry
    public fun get_task_count(registry_address: address): u64 acquires WorkflowRegistry {
        if (!exists<WorkflowRegistry>(registry_address)) {
            return 0
        };
        
        let registry = borrow_global<WorkflowRegistry>(registry_address);
        vector::length(&registry.tasks)
    }
    
    /// Get count of workflow tasks by owner
    public fun get_owner_task_count(registry_address: address, owner: address): u64 acquires WorkflowRegistry {
        assert!(exists<WorkflowRegistry>(registry_address), REGISTRY_NOT_INITIALIZED);
        let registry = borrow_global<WorkflowRegistry>(registry_address);
        let len = vector::length(&registry.tasks);
        let count = 0;
        let i = 0;
        
        while (i < len) {
            let task = vector::borrow(&registry.tasks, i);
            if (task.owner == owner) {
                count = count + 1;
            };
            i = i + 1;
        };
        
        count
    }
}
