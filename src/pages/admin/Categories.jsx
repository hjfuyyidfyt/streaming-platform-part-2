import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Plus, Trash, Edit } from 'lucide-react';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '' });
    const [isCreating, setIsCreating] = useState(false);

    const fetchCategories = async () => {
        try {
            const data = await api.getCategories();
            setCategories(data);
        } catch (error) {
            console.error("Failed to load categories", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            // Auto-generate slug if empty
            const slug = newCategory.slug || newCategory.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            await api.createCategory({ ...newCategory, slug });
            setNewCategory({ name: '', slug: '', description: '' });
            setIsCreating(false);
            fetchCategories();
        } catch (error) {
            alert("Failed to create category");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will not delete videos but unlink them.")) return;
        try {
            await api.deleteCategory(id);
            fetchCategories();
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Manage Categories</h2>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Category</span>
                </button>
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="bg-[#242424] p-6 rounded-xl border border-gray-800 mb-8 animate-fade-in">
                    <h3 className="text-lg font-bold mb-4">New Category</h3>
                    <form onSubmit={handleCreate} className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Category Name"
                                className="bg-[#121212] border border-gray-700 rounded-lg px-4 py-2 text-white"
                                value={newCategory.name}
                                onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Slug (optional)"
                                className="bg-[#121212] border border-gray-700 rounded-lg px-4 py-2 text-white"
                                value={newCategory.slug}
                                onChange={e => setNewCategory({ ...newCategory, slug: e.target.value })}
                            />
                        </div>
                        <textarea
                            placeholder="Description"
                            className="bg-[#121212] border border-gray-700 rounded-lg px-4 py-2 text-white h-24 resize-none"
                            value={newCategory.description}
                            onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-medium"
                            >
                                Save Category
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="bg-[#242424] rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-900/50 text-gray-400 text-sm">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Slug</th>
                            <th className="p-4">Description</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {categories.map(cat => (
                            <tr key={cat.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 font-medium">{cat.name}</td>
                                <td className="p-4 text-gray-400 text-sm font-mono">{cat.slug}</td>
                                <td className="p-4 text-gray-500 text-sm truncate max-w-xs">{cat.description || '-'}</td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="text-gray-500 hover:text-red-500 transition-colors p-2"
                                        title="Delete"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {categories.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-500">
                        No categories found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Categories;
