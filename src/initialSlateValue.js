
const documentsList = [
    {
        "document": {
            "nodes": [
                {
                    "object": "block",
                    "type": "paragraph",
                    "nodes": [
                        {
                            "object": "text",
                            "leaves": [
                                {
                                    "text": "This is the editor. Type here."
                                }
                            ]
                        }
                    ]
                },
                {
                    "object": "block",
                    "type": "ul_list",
                    "data": {
                        "style": {
                            "listStyleType": "disc"
                        }
                    },
                    "nodes": [
                        {
                            "object": "block",
                            "type": "list_item",
                            "nodes": [
                                {
                                    "object": "block",
                                    "type": "paragraph",
                                    "nodes": [
                                        {
                                            "object": "text",
                                            "leaves": [
                                                {
                                                    "text": "I am doc1"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        name:"doc1"
    },
    {
        "document": {
            "nodes": [
                {
                    "object": "block",
                    "type": "paragraph",
                    "nodes": [
                        {
                            "object": "text",
                            "leaves": [
                                {
                                    "text": "This is the editor. Type here."
                                }
                            ]
                        }
                    ]
                },
                {
                    "object": "block",
                    "type": "ul_list",
                    "data": {
                        "style": {
                            "listStyleType": "disc"
                        }
                    },
                    "nodes": [
                        {
                            "object": "block",
                            "type": "list_item",
                            "nodes": [
                                {
                                    "object": "block",
                                    "type": "paragraph",
                                    "nodes": [
                                        {
                                            "object": "text",
                                            "leaves": [
                                                {
                                                    "text": "I am doc2"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        name:"doc2"
    },
    {
        "document": {
            "nodes": [
                {
                    "object": "block",
                    "type": "paragraph",
                    "nodes": [
                        {
                            "object": "text",
                            "leaves": [
                                {
                                    "text": "This is the editor. Type here."
                                }
                            ]
                        }
                    ]
                },
                {
                    "object": "block",
                    "type": "ul_list",
                    "data": {
                        "style": {
                            "listStyleType": "disc"
                        }
                    },
                    "nodes": [
                        {
                            "object": "block",
                            "type": "list_item",
                            "nodes": [
                                {
                                    "object": "block",
                                    "type": "paragraph",
                                    "nodes": [
                                        {
                                            "object": "text",
                                            "leaves": [
                                                {
                                                    "text": "I am doc3"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        name:"doc3"
    },
    {
        "document": {
            "nodes": [
                {
                    "object": "block",
                    "type": "paragraph",
                    "nodes": [
                        {
                            "object": "text",
                            "leaves": [
                                {
                                    "text": "This is the editor. Type here."
                                }
                            ]
                        }
                    ]
                },
                {
                    "object": "block",
                    "type": "ul_list",
                    "data": {
                        "style": {
                            "listStyleType": "disc"
                        }
                    },
                    "nodes": [
                        {
                            "object": "block",
                            "type": "list_item",
                            "nodes": [
                                {
                                    "object": "block",
                                    "type": "paragraph",
                                    "nodes": [
                                        {
                                            "object": "text",
                                            "leaves": [
                                                {
                                                    "text": "I am doc4"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        name:"doc4"
    },
]

const initialValue = {
    "document": {
        "nodes": [
            {
                "object": "block",
                "type": "paragraph",
                "nodes": [
                    {
                        "object": "text",
                        "leaves": [
                            {
                                "text": "This is the editor. Type here."
                            }
                        ]
                    }
                ]
            },
            {
                "object": "block",
                "type": "ul_list",
                "data": {
                    "style": {
                        "listStyleType": "disc"
                    }
                },
                "nodes": [
                    {
                        "object": "block",
                        "type": "list_item",
                        "nodes": [
                            {
                                "object": "block",
                                "type": "paragraph",
                                "nodes": [
                                    {
                                        "object": "text",
                                        "leaves": [
                                            {
                                                "text": "This is node in a list. Hit [ENTER] and then hit [TAB]"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
};

Object.assign(module.exports, { initialValue, documentsList })
