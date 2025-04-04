module Geneforge::WorkflowAutomationCompliance {
    use std::vector;
    use std::signer;
    use aptos_framework::timestamp;

    /// Represents a workflow task in the lab.
    struct WorkflowTask has key, store {
        task_id: u64,
        description: vector<u8>,
        approved: bool,
        owner: address,
        timestamp: u64,
    }

    /// Global registry for workflow tasks.
    struct WorkflowRegistry has key, store {
        tasks: vector<WorkflowTask>,
        next_task_id: u64,
    }

    /// Initializes the workflow registry.
    public fun initialize_workflow_registry(account: &signer) {
        move_to(account, WorkflowRegistry {
            tasks: vector::empty<WorkflowTask>(),
            next_task_id: 0
        });
    }

    /// Submits a new workflow task.
    public fun submit_task(account: &signer, description: vector<u8>) acquires WorkflowRegistry {
        let registry = borrow_global_mut<WorkflowRegistry>(signer::address_of(account));
        let task_id = registry.next_task_id;
        registry.next_task_id = task_id + 1;
        let task = WorkflowTask {
            task_id: task_id,
            description: description,
            approved: false,
            owner: signer::address_of(account),
            timestamp: timestamp::now_seconds(),
        };
        vector::push_back(&mut registry.tasks, task);
    }

    /// Approves a workflow task.
    public fun approve_task(account: &signer, task_id: u64) acquires WorkflowRegistry {
        let registry = borrow_global_mut<WorkflowRegistry>(signer::address_of(account));
        let task_ref = find_task_mut(&mut registry.tasks, task_id);
        // In a real scenario, include an authorization check.
        task_ref.approved = true;
        task_ref.timestamp = timestamp::now_seconds();
    }

    /// Internal helper to find a mutable task by ID.
    fun find_task_mut(tasks: &mut vector<WorkflowTask>, task_id: u64): &mut WorkflowTask {
        let len = vector::length(tasks);
        let mut i = 0;
        while (i < len) {
            let task_ref = vector::borrow_mut(tasks, i);
            if (task_ref.task_id == task_id) {
                return task_ref;
            };
            i = i + 1;
        };
        abort 2;
    }
}
